from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import random
import logging
import json
from process_user import *
from fastapi.middleware.cors import CORSMiddleware

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # This allows all methods including OPTIONS
    allow_headers=["*"],
)

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
    confirmed_selections: List[Dict[str, str]] # e.g., [{"bank_name": "Sbank", "category": "PhilHealth"}]

# --- Глобальное хранилище (заменить на БД в проде) ---

# Статусы авторизации банков для пользователей
user_bank_auth_status: Dict[str, Dict[str, str]] = {}
# Результаты анализа для пользователей
user_analysis_results: Dict[str, List[AnalysisResult]] = {}
# Подтвержденные выборы пользователей
user_confirmed_choices: Dict[str, List[Dict[str, str]]] = {}

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
    # Инициализируем хранилище для нового пользователя, если нужно
    if credentials.login not in user_bank_auth_status:
        user_bank_auth_status[credentials.login] = {}
    if credentials.login not in user_analysis_results:
        user_analysis_results[credentials.login] = []
    if credentials.login not in user_confirmed_choices:
        user_confirmed_choices[credentials.login] = []

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
    confirmed_selections = request.confirmed_selections

    logger.info(f"User '{user_login}' confirmed cashbacks: {confirmed_selections}")

    # В реальной жизни тут была бы логика сохранения выбора в БД
    user_confirmed_choices[user_login] = confirmed_selections

    # Можно вернуть подтверждение
    return {"detail": "Cashbacks confirmed successfully", "confirmed_for_user": user_login}

# --- Запуск сервера ---
#uvicorn main:app --reload
