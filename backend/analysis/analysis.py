import itertools
import pandas as pd
from statistics import median


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

        best_value = -1
        best_combo = None
        best_combo_cbs = None

        for combo in itertools.combinations(categories, max_k):
            total_cb = 0
            categories_cbs = []

            for cat in combo:
                row = df_bank[df_bank['category'] == cat].iloc[0]
                percent = row['percent']
                cat_limit = row['category_limit']

                if cat == 'all':
                    cashback_cat = min(total_spend * percent / 100, cat_limit)

                else:
                    spend_series = prediction_df.loc[prediction_df['category'] == cat, 'predicted_amount']

                    if spend_series.empty:
                        spend = 0
                    else:
                        spend = spend_series.iloc[0]
                    cashback_cat = min(spend * percent / 100, cat_limit)

                total_cb += cashback_cat
                categories_cbs.append(cashback_cat)

            total_cb = min(total_cb, bank_limit)
            if total_cb > best_value:
                best_value = total_cb
                best_combo = combo
                best_combo_cbs = categories_cbs

        for cat, cb_amount in zip(best_combo, best_combo_cbs):
            results.append({'bank': bank, 'category': cat, 'total_cb': cb_amount.round(2)})

    return pd.DataFrame(results)


def previous_transactions_to_best_cashbacks(transactions_name='Expenses.xlsx', cashbacks_name='Cashbacks.xlsx',
                                            month='2022-08-01'):
    transactions = pd.read_excel(transactions_name)
    transactions['month'] = pd.to_datetime(transactions['Date'])
    transactions['month'] = transactions['month'].dt.to_period('M').dt.to_timestamp()
    transactions = transactions.rename(columns={'Expenses': 'category', 'Amount': 'amount'})
    transactions = transactions[['month', 'category', 'amount']]

    cashbacks = pd.read_excel(cashbacks_name)
    cashbacks['category_limit'] = cashbacks['category_limit'].fillna(float('inf'))

    return choose_best_cashback(prediction_model(transactions, month), cashbacks)


if __name__ == "__main__":
    print(previous_transactions_to_best_cashbacks())



