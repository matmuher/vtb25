import pandas as pd
import json
from analysis_try4 import *
import pandas as pd

def extract_columns_from_excel(file_path):
    """
    Извлекает столбцы 'bank', 'category', 'percent' из Excel-файла и возвращает их в виде списка словарей.

    :param file_path: путь к Excel-файлу
    :return: список словарей с ключами 'bank', 'category', 'percent'
    """
    # Читаем Excel-файл
    df = pd.read_excel(file_path)

    # Выбираем только нужные столбцы
    selected_columns = df[['bank', 'category', 'percent']]

    # Преобразуем в список словарей
    result = selected_columns.to_dict(orient='records')

    return result


def process_dataframe_and_rules(df, rules_list):
    """
    Обрабатывает датафрейм и список правил (словарей), возвращая JSON с полями:
    bank_name, category, percent, choosen ('yes'/'no'), total_cb (число или null).

    Сравнение bank и category — без учёта регистра и пробелов по краям.

    :param df: pandas DataFrame с колонками 'bank', 'category', 'total_cb'
    :param rules_list: список словарей с ключами 'bank', 'category', 'percent'
    :return: JSON-строка с результатом
    """
    # Создаём копию и нормализуем столбцы 'bank' и 'category'
    df_norm = df.copy()
    df_norm['bank_norm'] = df_norm['bank'].astype(str).str.strip().str.lower()
    df_norm['category_norm'] = df_norm['category'].astype(str).str.strip().str.lower()

    # Создаём словарь для быстрого поиска: (bank_norm, category_norm) -> total_cb
    cb_map = {}
    for _, row in df_norm.iterrows():
        key = (row['bank_norm'], row['category_norm'])
        cb_map[key] = row['total_cb']

    result = []
    for rule in rules_list:
        orig_bank = rule['bank']
        orig_category = rule['category']
        percent = rule['percent']

        # Нормализуем значения из rules_list
        bank_key = str(orig_bank).strip().lower()
        cat_key = str(orig_category).strip().lower()
        key = (bank_key, cat_key)

        # Проверяем наличие в карте
        if key in cb_map:
            choosen = 'yes'
            total_cb = cb_map[key]
        else:
            choosen = 'no'
            total_cb = None  # будет null в JSON

        result.append({
            'bank_name': orig_bank,
            'category': orig_category,
            'percent': percent,
            'choosen': choosen,
            'total_cb': total_cb
        })

    return json.dumps(result, indent=2, ensure_ascii=False)

