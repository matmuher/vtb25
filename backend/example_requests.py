from VTBAPI_Requests import *

def example():
    # 1. Создаём согласие на доступ к данным
    print("🔹 Создание согласия...")
    consent_response = AccountConsentsRequest(
        client_id="team089-1",
        permissions=["ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail"],
        reason="Анализ финансовой активности",
        requesting_bank="team089",
        requesting_bank_name="Team 089 Bank",
        x_requesting_bank="team089"
    )

    consent_id = consent_response.get("consent_id")
    if not consent_id:
        raise ValueError("❌ Ответ от /account-consents/request не содержит 'consent_id'")

    print(f"✅ Согласие создано: {consent_id}")

    # 2. Получаем список счетов
    print("🔹 Получение списка счетов...")
    accounts_response = GetAccountsList(
        client_id="team089-1",
        consent_id=consent_id,
        x_requesting_bank="team089"
    )

    accounts = accounts_response.get("data", {}).get("account", [])
    if not accounts:
        print("❌ Счета не найдены.")
        return

    print(f"✅ Найдено счетов: {len(accounts)}")

    # Берём первый счёт
    first_account = accounts[0]
    account_id = first_account.get("accountId")
    if not account_id:
        raise ValueError("❌ Счёт не содержит поля 'accountId'")

    print(f"🔹 Работаем со счётом: {account_id}")

    # 3. Получаем историю транзакций за 2025 год
    print("🔹 Запрос транзакций за 2025 год...")
    from_date = "2025-01-01T00:00:00Z"
    to_date = "2025-12-31T23:59:59Z"

    transactions_response = GetAccountTransactionHistory(
        account_id=account_id,
        consent_id=consent_id,
        from_booking_date_time=from_date,
        to_booking_date_time=to_date,
        page=1,
        limit=100,
        x_requesting_bank="team089"
    )

    transactions = transactions_response.get("data", {}).get("transaction", [])
    print(f"✅ Получено транзакций: {len(transactions)}")

    # Выводим первые 3 транзакции (если есть)
    for i, tx in enumerate(transactions[:3], 1):
        amount = tx["amount"]["amount"]
        currency = tx["amount"]["currency"]
        direction = "➕" if tx["creditDebitIndicator"] == "Credit" else "➖"
        info = tx.get("transactionInformation", "—")
        booking_date = tx.get("bookingDateTime", "")[:10]  # Только дата
        print(f"  {i}. {direction} {amount} {currency} | {info} | {booking_date}")

    if not transactions:
        print("ℹ️  Транзакций за указанный период не найдено.")

if __name__ == "__main__":
    example()
