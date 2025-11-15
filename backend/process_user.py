from preparation import *
from cashbacks_process import *
from banks_access import *

#sync_user_banks("team089-1", ["sbank", "abank"])

#update_missing_consents("team089-1", meow)

#print_user_banks_info("team089-1")

#refresh_user_consents("team089-1", meow)

#fetch_and_store_accounts("team089-1", meow)

#print_user_banks_info("team089-1")

#print(fetch_all_transactions("team089-1", meow))


def has_expired_bank(statuses_list: list) -> bool:
    """
    Проверяет, содержит ли список статусов хотя бы один банк со статусом 'expired'.

    Args:
        statuses_list (list): Список словарей со статусами банков. 
                              Каждый словарь должен содержать ключ 'status' и, желательно, 'bank_name'.

    Returns:
        bool: True, если найден хотя бы один банк со статусом 'expired', иначе False.
    """
    return any(item.get('status') == 'expired' for item in statuses_list if isinstance(item, dict))

def push_consents_to_banks(user_name: str, banks_list: list):
    update_expired_tokens()
    sync_user_banks(user_name, banks_list)
    update_missing_consents(user_name)
    statuses_list = []
    refresh_user_consents(user_name, statuses_list)
    while has_expired_bank(statuses_list):
        update_missing_consents(user_name)
        statuses_list = []
        refresh_user_consents(user_name, statuses_list)

    return statuses_list

def analyze_best_cashbacks(user_name: str):
    fetch_and_store_accounts(user_name)
    transactions_data = fetch_all_transactions(user_name)
    l = extract_columns_from_excel("Cashbacks.xlsx")
    df = json_transactions_to_best_cashbacks(transactions_data, "Cashbacks.xlsx", "2025-10-01")
    return process_dataframe_and_rules(df, l)

