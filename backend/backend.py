from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import random
import logging
import json
from process_user import *

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- Модели данных Pydantic ---

class LoginRequest(BaseModel):
    login: str
    password: str

class BankSelectionRequest(BaseModel):
    user_login: str
    selected_banks: List[str]

class BankStatus(BaseModel):
    bank_name: str
    status: str  # "authorized", "error", "pending"
    details: Optional[str] = None

class AnalysisResult(BaseModel):
    bank_name: str
    category: str
    percent: float
    choosen: str  # "yes", "no"
    total_cb: Optional[float]

class ConfirmationRequest(BaseModel):
    user_login: str
    results: str
    #confirmed_selections: List[Dict[str, str]] # e.g., [{"bank_name": "Sbank", "category": "PhilHealth"}]

class TransactionInfo(BaseModel):
    название_магазина: str
    сумма_траты: float
    какой_кешбек_получил: float
    flag_is_optimal: bool
    совет: str

# --- Глобальное хранилище (заменить на БД в проде) ---

# Подтвержденные выборы пользователей
user_confirmed_choices: Dict[str, List[AnalysisResult]] = {} # Храним объекты AnalysisResult

# --- Глобальное хранилище (заменить на БД в проде) ---

# Статусы авторизации банков для пользователей
user_bank_auth_status: Dict[str, Dict[str, str]] = {}
# Результаты анализа для пользователей
user_analysis_results: Dict[str, List[AnalysisResult]] = {}

# --- Вспомогательные функции ---

def mock_authorize_banks(bank_names: List[str]) -> List[BankStatus]:
    """
    Имитирует процесс авторизации банков.
    В реальной жизни это включало бы OAuth, вызовы API банков и т.д.
    """
    logger.info(f"Mock authorizing banks: {bank_names}")
    statuses = []
    for bank in bank_names:
        # Имитация случайного результата и задержки
        # 90% шанс успеха
        status = "authorized" if random.random() < 0.9 else "error"
        details = "Successfully linked" if status == "authorized" else "Authorization failed"
        statuses.append(BankStatus(bank_name=bank, status=status, details=details))
        # Имитация сетевой задержки
        # asyncio.sleep(0.1) # Нельзя использовать sync sleep в async контексте
    return statuses

def mock_analyze_spends(user_login: str, selected_banks: List[str]) -> List[AnalysisResult]:
    """
    Имитирует анализ трат и генерацию предложений по кэшбэку.
    В реальной жизни это включало бы получение транзакций, их анализ, ML и т.д.
    """
    logger.info(f"Mock analyzing spends for user '{user_login}' and banks {selected_banks}")
    # Имитация задержки анализа
    # await asyncio.sleep(2) # Использовать await внутри async функции

    results = []
    sample_categories = ["Groceries", "Gas", "Dining", "Travel", "Entertainment", "Utilities", "Pharmacy", "Shopping"]
    for bank in selected_banks:
        num_categories = random.randint(3, 7)
        for _ in range(num_categories):
            cat = random.choice(sample_categories)
            # Уникальность не гарантируется, но для затычки сойдёт
            percent = round(random.uniform(0.5, 8.0), 2)
            choosen = random.choice(["yes", "no"])
            total_cb = round(random.uniform(0.0, 50.0), 2) if choosen == "yes" else None
            results.append(AnalysisResult(
                bank_name=bank,
                category=cat,
                percent=percent,
                choosen=choosen,
                total_cb=total_cb
            ))
    return results

# --- Ручки API ---

@app.post("/api/login")
async def login(credentials: LoginRequest):
    # Проверка логина и пароля (в реальной жизни - проверка в БД или через OAuth)
    # Для затычки принимаем любые непустые данные
    if not credentials.login or not credentials.password:
        raise HTTPException(status_code=400, detail="Login and password are required")

    logger.info(f"User '{credentials.login}' logged in.")

    return {"detail": "Login successful", "user_login": credentials.login}


@app.post("/api/select_banks")
async def select_banks(request: BankSelectionRequest):
    user_login = request.user_login
    selected_banks = request.selected_banks

    logger.info(f"User '{user_login}' selected banks: {selected_banks}")

    current_statuses = push_consents_to_banks(user_login, selected_banks) 
    return {"statuses": current_statuses}


@app.get("/api/bank_status/{user_login}")
async def get_bank_status(user_login: str):
    logger.info(f"Fetching bank status for user '{user_login}'")
    if user_login not in user_bank_auth_status:
        raise HTTPException(status_code=404, detail="User not found")

    statuses = [
        BankStatus(bank_name=bank, status=status)
        for bank, status in user_bank_auth_status[user_login].items()
    ]

    all_authorized = all(s.status == "authorized" for s in statuses)
    logger.info(f"Status check for '{user_login}': All authorized = {all_authorized}")

    # Если все авторизованы и анализ ещё не был выполнен, запускаем его
    if all_authorized and user_login not in user_analysis_results:
        selected_banks = list(user_bank_auth_status[user_login].keys())
        analysis_data = mock_analyze_spends(user_login, selected_banks)
        user_analysis_results[user_login] = analysis_data
        logger.info(f"Analysis completed for user '{user_login}'.")

    return {"statuses": statuses}


@app.get("/api/analysis_results/{user_login}")
async def get_analysis_results(user_login: str):
    logger.info(f"Fetching analysis results for user '{user_login}'")
    #if user_login not in user_analysis_results:
        # Проверяем, может быть анализ ещё не завершён?
        # В этой простой затычке, если результатов нет, но статусы есть, возвращаем пустой список.
        #if user_login in user_bank_auth_status:
             # Или лучше вернуть ошибку, если ожидается результат?
             # raise HTTPException(status_code=204, detail="Analysis not ready or not started")
             #return {"results": []}
        #else:
            #raise HTTPException(status_code=404, detail="User not found or analysis not started")

    results = analyze_best_cashbacks(user_login)
    return {"results": results}

@app.post("/api/confirm_cashbacks")
async def confirm_cashbacks(request: ConfirmationRequest):
    user_login = request.user_login
    # Парсим строку JSON из поля 'results'
    try:
        raw_results_list = json.loads(request.results)
        # Преобразуем каждый элемент в объект AnalysisResult
        parsed_results = [AnalysisResult(**item) for item in raw_results_list]
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format in 'results' for user '{user_login}': {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON format in 'results' field.")
    except (TypeError, ValueError) as e:
        logger.error(f"Invalid data structure in 'results' for user '{user_login}': {e}")
        raise HTTPException(status_code=400, detail="Invalid data structure in 'results' field. Expected list of objects matching AnalysisResult schema.")

    logger.info(f"User '{user_login}' confirmed cashbacks: {parsed_results}")

    # В реальной жизни тут была бы логика сохранения выбора в БД
    # Сохраняем подтвержденные выборы как список объектов AnalysisResult
    user_confirmed_choices[user_login] = parsed_results

    # --- Логика генерации ответа ---
    # 1. Получить все транзакции пользователя за ПРОШЛЫЙ месяц
    try:
        # Определяем даты для прошлого месяца
        today = datetime.today()
        first_day_current_month = today.replace(day=1)
        last_day_previous_month = first_day_current_month - timedelta(days=1)
        first_day_previous_month = last_day_previous_month.replace(day=1)

        from_date = first_day_previous_month.strftime('%Y-%m-01T00:00:00Z')
        to_date = last_day_previous_month.strftime('%Y-%m-%dT23:59:59Z')

        logger.info(f"Fetching transactions for user '{user_login}' from {from_date} to {to_date}")
        all_transactions = fetch_all_transactions(user_login, from_date=from_date, to_date=to_date)
    except Exception as e:
        logger.error(f"Error fetching transactions for user '{user_login}': {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch transaction history.")

    # 2. Подготовить словарь подтверждённых кешбэков для быстрого поиска
    # confirmed_cashbacks_by_bank = { "bank_name": { "category": percent, ... }, ... }
    confirmed_cashbacks_by_bank = {}
    for choice in parsed_results:
        if choice.choosen == "yes":
            bank_name = choice.bank_name.lower() # Приводим к нижнему регистру для сопоставления
            if bank_name not in confirmed_cashbacks_by_bank:
                confirmed_cashbacks_by_bank[bank_name] = {}
            # Используем choice.percent напрямую, так как он уже числовое значение
            confirmed_cashbacks_by_bank[bank_name][choice.category.lower()] = choice.percent

    # 3. Обработать транзакции
    categorized_transactions = {}
    for tx in all_transactions:
        # Извлекаем данные из транзакции
        bank_name_raw = tx.get("_bank_name")
        if not bank_name_raw:
            logger.warning(f"Transaction {tx.get('transactionId')} has no _bank_name. Skipping.")
            continue

        bank_name_lower = bank_name_raw.lower()
        merchant_info = tx.get("merchant")
        category_raw = None
        if merchant_info:
            category_raw = merchant_info.get("category")
        # Если category_raw не найдена, пропускаем транзакцию
        if not category_raw:
            logger.info(f"Transaction {tx.get('transactionId')} has no category. Skipping.")
            continue
        category_lower = category_raw.lower()

        # Используем merchant.name, если он есть, иначе transactionInformation
        merchant_name = "Unknown Merchant"
        if merchant_info and merchant_info.get("name"):
            merchant_name = merchant_info["name"]
        else:
            merchant_name = tx.get("transactionInformation", merchant_name)

        amount_str = tx.get("amount", {}).get("amount")
        if amount_str is None:
            logger.warning(f"Transaction {tx.get('transactionId')} has no amount. Skipping.")
            continue
        try:
            amount = float(amount_str)
        except ValueError:
            logger.warning(f"Could not parse amount '{amount_str}' for transaction {tx.get('transactionId')}. Skipping.")
            continue

        # Определяем, был ли кешбэк оптимальным
        is_optimal = False
        advice = ""
        cashback_received = 0.0

        # Проверяем, есть ли кешбэк для этой категории в банке, где была транзакция
        if bank_name_lower in confirmed_cashbacks_by_bank:
            if category_lower in confirmed_cashbacks_by_bank[bank_name_lower]:
                # Кешбэк для этой категории в этом банке выбран пользователем
                cashback_rate = confirmed_cashbacks_by_bank[bank_name_lower][category_lower]
                cashback_received = (cashback_rate / 100) * amount
                is_optimal = True # Считаем оптимальным, если банк, по которому была транзакция, выбран для этой категории
                advice = "" # Пустой совет, если оптимально
            else:
                # Банк есть, но кешбэк на эту категорию не выбран
                # Тогда ищем лучший кешбэк среди всех выбранных банок для этой категории
                best_cashback_rate = 0.0
                best_bank_name = None
                for chosen_bank, categories in confirmed_cashbacks_by_bank.items():
                    if category_lower in categories:
                        rate = categories[category_lower]
                        if rate > best_cashback_rate:
                            best_cashback_rate = rate
                            best_bank_name = chosen_bank

                if best_bank_name:
                    is_optimal = False
                    advice = f"Consider using a card from {best_bank_name.upper()} for {category_raw} to maximize cashback."
                else:
                    # Категория не выбрана ни в одном банке
                    is_optimal = False
                    advice = f"No cashback category selected for '{category_raw}' among your chosen banks."
        else:
            # Банк, по которому была транзакция, не выбран пользователем
            # Ищем лучший кешбэк среди выбранных банок
            best_cashback_rate = 0.0
            best_bank_name = None
            for chosen_bank, categories in confirmed_cashbacks_by_bank.items():
                if category_lower in categories:
                    rate = categories[category_lower]
                    if rate > best_cashback_rate:
                        best_cashback_rate = rate
                        best_bank_name = chosen_bank

            if best_bank_name:
                is_optimal = False
                advice = f"Consider using a card from {best_bank_name.upper()} for {category_raw} to maximize cashback."
            else:
                # Категория не выбрана ни в одном банке
                is_optimal = False
                advice = f"No cashback category selected for '{category_raw}' among your chosen banks."

        # Добавляем информацию о транзакции в словарь по категории
        if category_raw not in categorized_transactions:
            categorized_transactions[category_raw] = []
        categorized_transactions[category_raw].append(
            TransactionInfo(
                название_магазина=merchant_name,
                сумма_траты=amount,
                какой_кешбек_получил=cashback_received,
                flag_is_optimal=is_optimal,
                совет=advice
            )
        )

    # 4. Формирование финального ответа
    response_data = categorized_transactions
    return response_data

# uvicorn backend:app --reload &
