import requests
import json
from datetime import datetime
from typing import Optional

# 0
def CreateBankToken(
    client_id: str,
    client_secret: str,
    base_url: str = "https://abank.open.bankingapi.ru"
) -> dict:
    """
    Создаёт банковский токен аутентификации (bank token) для доступа к API.

    :param client_id: Идентификатор клиента (например, "team089")
    :param client_secret: Секретный ключ клиента
    :param base_url: Базовый URL API
    :return: Ответ от сервера в виде словаря (обычно содержит access_token и другие поля)
    :raises: requests.HTTPError — при ошибках HTTP
    """
    url = f"{base_url}/auth/bank-token"
    params = {
        "client_id": client_id,
        "client_secret": client_secret
    }
    headers = {
        "accept": "application/json"
    }

    response = requests.post(url, headers=headers, params=params, data='')
    response.raise_for_status()
    return response.json()

# 1.1
def AccountConsentsRequest(
    client_id: str,
    permissions: list,
    reason: str = "",
    requesting_bank: str = "test_bank",
    requesting_bank_name: str = "Test Bank",
    x_requesting_bank: str = "team089",
    access_token: str = "",
    token_type: str = "Bearer",
    base_url: str = "https://abank.open.bankingapi.ru"
) -> dict:
    """
    Отправляет запрос на создание согласия на доступ к счетам.

    :param client_id: Идентификатор клиента (например, "team089-1")
    :param permissions: Список разрешений (например, ["ReadAccountsDetail", "ReadBalances", ...])
    :param reason: Причина запроса (опционально)
    :param requesting_bank: Идентификатор запрашивающего банка
    :param requesting_bank_name: Название запрашивающего банка
    :param x_requesting_bank: Значение заголовка X-Requesting-Bank
    :param access_token: Токен доступа для авторизации
    :param token_type: Тип токена (по умолчанию "Bearer")
    :param base_url: Базовый URL API (по умолчанию — продакшн-эндпоинт)
    :return: Ответ от сервера в виде словаря (JSON)
    :raises: requests.HTTPError — при ошибках HTTP
    """
    url = f"{base_url}/account-consents/request"

    headers = {
        "accept": "application/json",
        "x-requesting-bank": x_requesting_bank,
        "Content-Type": "application/json",
        "Authorization": f"{token_type} {access_token}"
    }

    payload = {
        "client_id": client_id,
        "permissions": permissions,
        "reason": reason,
        "requesting_bank": requesting_bank,
        "requesting_bank_name": requesting_bank_name
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    response.raise_for_status()  # вызовет исключение при HTTP ошибке
    return response.json()

# 1.2
def GetConsentByID(
    consent_id: str,
    x_fapi_interaction_id: str = "team089",
    access_token: str = "",
    token_type: str = "Bearer",
    base_url: str = "https://sbank.open.bankingapi.ru"
) -> dict:
    """
    Получает информацию о согласии по его идентификатору.

    :param consent_id: Идентификатор согласия (например, "req-bfcddced4b19")
    :param x_fapi_interaction_id: Значение заголовка X-Fapi-Interaction-Id (по умолчанию "team089")
    :param access_token: Токен доступа для авторизации
    :param token_type: Тип токена (по умолчанию "Bearer")
    :param base_url: Базовый URL API (по умолчанию для sbank)
    :return: Ответ от сервера в виде словаря (JSON)
    :raises: requests.HTTPError — при ошибках HTTP
    """
    url = f"{base_url}/account-consents/{consent_id}"
    headers = {
        "accept": "application/json",
        "x-fapi-interaction-id": x_fapi_interaction_id,
        "Authorization": f"{token_type} {access_token}"
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# 2.1
def GetAccountsList(
    client_id: str,
    consent_id: str,
    x_requesting_bank: str = "team089",
    access_token: str = "",
    token_type: str = "Bearer",
    base_url: str = "https://abank.open.bankingapi.ru"
) -> dict:
    """
    Получает список счетов клиента по согласию.

    :param client_id: Идентификатор клиента (например, "team089-1")
    :param consent_id: Идентификатор согласия (например, "consent-2e079bcd17b1")
    :param x_requesting_bank: Значение заголовка X-Requesting-Bank (по умолчанию "team089")
    :param access_token: Токен доступа для авторизации
    :param token_type: Тип токена (по умолчанию "Bearer")
    :param base_url: Базовый URL API
    :return: Ответ от сервера в виде словаря (JSON)
    :raises: requests.HTTPError — при ошибках HTTP
    """
    url = f"{base_url}/accounts"
    params = {"client_id": client_id}
    headers = {
        "accept": "application/json",
        "x-consent-id": consent_id,
        "x-requesting-bank": x_requesting_bank,
        "Authorization": f"{token_type} {access_token}"
    }

    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

# 2.2
def GetAccountDetails(
    account_id: str,
    consent_id: str,
    x_requesting_bank: str = "team089",
    access_token: str = "",
    token_type: str = "Bearer",
    base_url: str = "https://abank.open.bankingapi.ru"
) -> dict:
    """
    Получает детальную информацию по конкретному счёту.

    :param account_id: Идентификатор счёта (например, "acc-1981")
    :param consent_id: Идентификатор согласия (например, "consent-2e079bcd17b1")
    :param x_requesting_bank: Значение заголовка X-Requesting-Bank (по умолчанию "team089")
    :param access_token: Токен доступа для авторизации
    :param token_type: Тип токена (по умолчанию "Bearer")
    :param base_url: Базовый URL API
    :return: Ответ от сервера в виде словаря (JSON)
    :raises: requests.HTTPError — при ошибках HTTP
    """
    url = f"{base_url}/accounts/{account_id}"
    headers = {
        "accept": "application/json",
        "x-consent-id": consent_id,
        "x-requesting-bank": x_requesting_bank,
        "Authorization": f"{token_type} {access_token}"
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# 2.3
def GetAccountBalance(
    account_id: str,
    consent_id: str,
    x_requesting_bank: str = "team089",
    access_token: str = "",
    token_type: str = "Bearer",
    base_url: str = "https://abank.open.bankingapi.ru"
) -> dict:
    """
    Получает баланс по указанному счёту.

    :param account_id: Идентификатор счёта (например, "acc-1981")
    :param consent_id: Идентификатор согласия (например, "consent-2e079bcd17b1")
    :param x_requesting_bank: Значение заголовка X-Requesting-Bank (по умолчанию "team089")
    :param access_token: Токен доступа для авторизации
    :param token_type: Тип токена (по умолчанию "Bearer")
    :param base_url: Базовый URL API
    :return: Ответ от сервера в виде словаря (JSON)
    :raises: requests.HTTPError — при ошибках HTTP
    """
    url = f"{base_url}/accounts/{account_id}/balances"
    headers = {
        "accept": "application/json",
        "x-consent-id": consent_id,
        "x-requesting-bank": x_requesting_bank,
        "Authorization": f"{token_type} {access_token}"
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# 2.4
def GetAccountTransactionHistory(
    account_id: str,
    consent_id: str,
    from_booking_date_time: str,
    to_booking_date_time: str,
    page: int = 1,
    limit: int = 50,
    x_requesting_bank: str = "team089",
    access_token: str = "",
    token_type: str = "Bearer",
    base_url: str = "https://abank.open.bankingapi.ru"
) -> dict:
    """
    Получает историю транзакций по указанному счёту за заданный период.

    :param account_id: Идентификатор счёта (например, "acc-1981")
    :param consent_id: Идентификатор согласия (например, "consent-2e079bcd17b1")
    :param from_booking_date_time: Начало периода в формате ISO 8601 (например, "2025-01-01T00:00:00Z")
    :param to_booking_date_time: Конец периода в формате ISO 8601 (например, "2025-12-31T23:59:59Z")
    :param page: Номер страницы (по умолчанию 1)
    :param limit: Количество транзакций на странице (по умолчанию 50)
    :param x_requesting_bank: Значение заголовка X-Requesting-Bank (по умолчанию "team089")
    :param access_token: Токен доступа для авторизации
    :param token_type: Тип токена (по умолчанию "Bearer")
    :param base_url: Базовый URL API
    :return: Ответ от сервера в виде словаря (JSON)
    :raises: requests.HTTPError — при ошибках HTTP
    """
    url = f"{base_url}/accounts/{account_id}/transactions"

    params = {
        "from_booking_date_time": from_booking_date_time,
        "to_booking_date_time": to_booking_date_time,
        "page": page,
        "limit": limit
    }

    headers = {
        "accept": "application/json",
        "x-consent-id": consent_id,
        "x-requesting-bank": x_requesting_bank,
        "Authorization": f"{token_type} {access_token}"
    }

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()
