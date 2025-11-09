import itertools
import pandas as pd
from statistics import median
import json


def avg_based_prediction(data, month, n_of_months):
    cutoff = pd.Timestamp(month) - pd.DateOffset(months=n_of_months)

    prediction = data[(data['month'] < month) & (data['month'] >= cutoff)]
    prediction = prediction.groupby('category').agg(sum=('amount', 'sum')).reset_index()

    name = f'pred_avg_{n_of_months}'
    prediction[name] = (prediction['sum'] / n_of_months)
    prediction = prediction[['category', name]]

    return prediction


def direct_model(data, month, w_3=0.6, w_6=0.3, w_12=0.1):
    data_3 = avg_based_prediction(data, month, 3)
    data_6 = avg_based_prediction(data, month, 6)
    data_12 = avg_based_prediction(data, month, 12)

    prediction = data_3.merge(data_6, on='category', how='outer').merge(data_12, on='category', how='outer')
    prediction = prediction.fillna(0)
    prediction['direct_prediction'] = w_3 * prediction['pred_avg_3'] + w_6 * prediction['pred_avg_3'] + \
                                      w_12 * prediction['pred_avg_12']
    prediction['direct_prediction'] = prediction['direct_prediction']

    return prediction[['category', 'direct_prediction']]


def total_expenses_prediction(data, month, weights=(0.6, 0.3, 0.1), cut_months=(1, 3, 12)):
    total_expenses = data.groupby('month').agg(total=('amount', 'sum')).reset_index()

    res = 0
    for i in range(len(weights)):
        cutoff = pd.Timestamp(month) - pd.DateOffset(months=cut_months[i])
        tot_sum = sum(total_expenses[(total_expenses['month'] < month) & (total_expenses['month'] >= cutoff)]['total'])
        tot_avg = tot_sum / cut_months[i]
        res += weights[i] * tot_avg

    return res


def share_model(data, month, n_of_months=3, weights=(0.6, 0.3, 0.1), cut_months=(1, 3, 12)):
    cutoff = pd.Timestamp(month) - pd.DateOffset(months=n_of_months)
    prediction = data[(data['month'] < month) & (data['month'] >= cutoff)].copy()

    prediction['month_total'] = prediction.groupby('month')['amount'].transform('sum')
    prediction = prediction.groupby(['month', 'month_total', 'category']).agg(cat_month_total=('amount', 'sum'))
    prediction = prediction.reset_index()
    prediction['cat_month_share'] = prediction['cat_month_total'] / prediction['month_total']

    prediction = prediction.groupby('category')['cat_month_share'].apply(list).reset_index(name='share_list')
    prediction['share_list'] = prediction['share_list'].apply(lambda lst: lst + [0] * (n_of_months - len(lst)))
    prediction['cat_share'] = prediction['share_list'].apply(median)
    prediction['cat_share'] = prediction['cat_share'] / sum(prediction['cat_share'])

    total_expenses = total_expenses_prediction(data, month, weights=weights, cut_months=cut_months)
    prediction['share_prediction'] = prediction['cat_share'] * total_expenses

    return prediction[['category', 'share_prediction']]


def prediction_model(data, month, w_share=0.7, w_direct=0.3):
    share_data = share_model(data, month)
    direct_data = direct_model(data, month)

    prediction = share_data.merge(direct_data, on='category', how='outer').fillna(0)
    prediction['predicted_amount'] = w_share * prediction['share_prediction'] + w_direct * prediction[
        'direct_prediction']
    return prediction[['category', 'predicted_amount']]


def choose_best_cashback(prediction_df, cashback_df):
    results = []
    total_spend = prediction_df['predicted_amount'].sum()

    for bank, df_bank in cashback_df.groupby("bank"):
        max_k = df_bank['max_categories_in_bank'].iloc[0]
        bank_limit = df_bank['bank_limit'].iloc[0]
        categories = df_bank['category'].tolist()

        # === Ищем категорию "all" в любом регистре ===
        all_row = None
        for _, row in df_bank.iterrows():
            if row['category'].strip().lower() == 'all':
                all_row = row
                break

        best_value = -1
        best_combo = None
        best_combo_cbs = None

        # === Вариант 1: стратегия "all" ===
        if all_row is not None:
            percent = all_row['percent']
            cat_limit = all_row['category_limit']
            cb_all = min(total_spend * percent / 100, cat_limit, bank_limit)
            if cb_all > best_value:
                best_value = cb_all
                best_combo = [all_row['category']]  # сохраняем оригинальное написание
                best_combo_cbs = [cb_all]

        # === Вариант 2: комбинации без "all" ===
        categories_no_all = df_bank[df_bank['category'].str.strip().str.lower() != 'all']
        cat_list = categories_no_all['category'].tolist()

        if cat_list:
            for combo in itertools.combinations(cat_list, min(max_k, len(cat_list))):
                total_cb = 0
                categories_cbs = []

                for cat in combo:
                    row = df_bank[df_bank['category'] == cat].iloc[0]
                    percent = row['percent']
                    cat_limit = row['category_limit']

                    spend_series = prediction_df.loc[prediction_df['category'] == cat, 'predicted_amount']
                    spend = spend_series.iloc[0] if not spend_series.empty else 0
                    cashback_cat = min(spend * percent / 100, cat_limit)

                    total_cb += cashback_cat
                    categories_cbs.append(cashback_cat)

                total_cb = min(total_cb, bank_limit)
                if total_cb > best_value:
                    best_value = total_cb
                    best_combo = combo
                    best_combo_cbs = categories_cbs

        # === Сохраняем результат ===
        if best_combo is not None:
            for cat, cb_amount in zip(best_combo, best_combo_cbs):
                results.append({'bank': bank, 'category': cat, 'total_cb': cb_amount})

    return pd.DataFrame(results)

def parse_transactions_json_to_dataframe(transactions_json_data):
    """
    Преобразует JSON-данные транзакций в DataFrame.
    Поддерживает два формата:
    - {"data": {"transaction": [...]}}
    - [...]
    """
    if isinstance(transactions_json_data, dict):
        raw_data = transactions_json_data.get("data", {}).get("transaction", [])
    elif isinstance(transactions_json_data, list):
        raw_data = transactions_json_data
    else:
        raw_data = []

    records = []

    # Список ожидаемых категорий (можно вынести в конфиг)
    known_categories = {
        'Hair Cut', 'Hair cut', 'hair cut',
        'Зарплата',
        'Транспорт',
        'Grocery', 'grocery', 'Food', 'cafe', 'restaurant',
        'Clothing', 'Shoes', 'Personal Items',
        'Pharmacy', 'Drugstore', 'Personal Care',
        'Eating/Going Out'
    }

    for tx in raw_data:
        if tx.get("status") != "completed":
            continue

        category = None

        # 1. Из merchant.category
        if tx.get("merchant") and tx["merchant"].get("category"):
            category = tx["merchant"]["category"]

        # 2. Если merchant нет, но transactionInformation совпадает с известной категорией
        elif tx.get("transactionInformation"):
            info = tx["transactionInformation"].strip()
            # Проверяем точное совпадение (регистронезависимо)
            if any(info.lower() == cat.lower() for cat in known_categories):
                category = info  # сохраняем оригинальный регистр
            else:
                # Можно попробовать частичные совпадения, но пока просто помечаем как платеж
                category = "other_payments"
        else:
            category = "other_payments"

        # Приводим к единому формату: Title Case
        category = str(category).title().strip()

        # Сумма
        amount = float(tx["amount"]["amount"])
        if tx.get("creditDebitIndicator") == "Debit":
            amount = -amount

        booking_time = pd.to_datetime(tx["bookingDateTime"])
        if booking_time.tz is not None:
            booking_time = booking_time.tz_localize(None)
        month = booking_time.to_period('M').to_timestamp()

        # Только Debit-операции (расходы)
        if tx.get("creditDebitIndicator") == "Debit":
            records.append({
                "month": month,
                "category": category,
                "amount": abs(amount)
            })

    df = pd.DataFrame(records) if records else pd.DataFrame(columns=["month", "category", "amount"])
    return df

def filter_out_categories(df, exclude_categories=None):
    """
    Удаляет строки с категориями из списка exclude_categories.
    """
    if exclude_categories is None:
        exclude_categories = ['Зарплата', 'Other Payments', 'Платеж По Кредиту', 'Payment', 'Transfer', 'Salary']

    exclude_set = {cat.strip().title() for cat in exclude_categories}
    return df[~df['category'].isin(exclude_set)].reset_index(drop=True)


def json_transactions_to_best_cashbacks(transactions_json_data, cashbacks_name='Cashbacks.xlsx', month='2025-11-01'):
    """
    Аналог previous_transactions_to_best_cashbacks, но принимает JSON-данные транзакций.
    """
    transactions = parse_transactions_json_to_dataframe(transactions_json_data)
    
    # Фильтруем ненужные категории
    exclude_cats = ['Зарплата', 'Other Payments', 'Платеж По Кредиту', 'Payment', 'Transfer', 'Salary']
    transactions = filter_out_categories(transactions, exclude_cats)
    
    cashbacks = pd.read_excel(cashbacks_name)
    # Приводим категории в кешбэках к title() для согласования
    cashbacks['category'] = cashbacks['category'].astype(str).str.strip().str.title()
    cashbacks['category_limit'] = cashbacks['category_limit'].fillna(float('inf'))

    return choose_best_cashback(prediction_model(transactions, month), cashbacks)
