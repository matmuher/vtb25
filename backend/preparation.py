import sqlite3
from typing import List
from VTBAPI_Requests import *
from datetime import datetime, timezone
from typing import Optional

# Помещаем банки в БД
def sync_user_banks(user_name: str, bank_list: List[str], db_path: str = "users.db"):
    """
    Синхронизирует список банков пользователя в SQLite, помечая неактивные банки.

    :param user_name: Имя пользователя (уникальный идентификатор)
    :param bank_list: Список названий банков, которые сейчас используются
    :param db_path: Путь к файлу SQLite (по умолчанию "users.db")
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Создаём таблицу, если не существует (с поддержкой is_active)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_banks (
            user_name TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            account_id TEXT,
            consent_id TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (user_name, bank_name)
        )
    """)
    conn.commit()

    # Получаем текущие банки пользователя из БД
    cursor.execute("SELECT bank_name FROM user_banks WHERE user_name = ?", (user_name,))
    existing_banks = set(row[0] for row in cursor.fetchall())
    input_banks = set(bank_list)

    # 1. Помечаем все банки пользователя как НЕактивные (на случай, если что-то убрали)
    cursor.execute(
        "UPDATE user_banks SET is_active = 0 WHERE user_name = ?",
        (user_name,)
    )

    # 2. Для каждого банка из входного списка:
    for bank in input_banks:
        if bank in existing_banks:
            # Обновляем существующий: активируем
            cursor.execute(
                "UPDATE user_banks SET is_active = 1 WHERE user_name = ? AND bank_name = ?",
                (user_name, bank)
            )
        else:
            # Добавляем новый банк как активный
            cursor.execute(
                "INSERT INTO user_banks (user_name, bank_name, account_id, consent_id, is_active) VALUES (?, ?, NULL, NULL, 1)",
                (user_name, bank)
            )

    conn.commit()
    conn.close()

# Выбор только активных банков
def get_active_banks(user_name: str, db_path: str = "users.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT bank_name, consent_id, account_id FROM user_banks WHERE user_name = ? AND is_active = 1",
        (user_name,)
    )
    return cursor.fetchall()

# Сделать запрос на получение согласия у активных банков, у которых consent_id=NULL
def update_missing_consents(
    user_name: str,
    requesting_bank: str = "team089",  # ваш банк-инициатор
    db_path: str = "users.db"
):
    """
    Создаёт согласия для активных банков пользователя, у которых нет consent_id.
    
    Запрос отправляется на https://{bank_name}.open.bankingapi.ru
    от имени requesting_bank (например, team089).
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Получаем активные банки без consent_id
    cursor.execute("""
        SELECT bank_name 
        FROM user_banks 
        WHERE user_name = ? AND is_active = 1 AND (consent_id IS NULL OR consent_id = '')
    """, (user_name,))
    
    banks_needing_consent = [row[0] for row in cursor.fetchall()]
    if not banks_needing_consent:
        conn.close()
        return

    for bank_name in banks_needing_consent:
        try:
            # Формируем base_url для целевого банка
            base_url = f"https://{bank_name}.open.bankingapi.ru"

            # Отправляем запрос на согласие
            response = AccountConsentsRequest(
                client_id=user_name,
                permissions=["ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail"],
                reason="Автоматическое согласие для подключённого банка",
                requesting_bank=requesting_bank,          # например, "team089"
                requesting_bank_name="Team 089 Bank",
                x_requesting_bank=requesting_bank,        # "team089"
                base_url=base_url                         # ← ключевое: URL целевого банка
            )

            status = response.get("status")
            request_id = response.get("request_id")
            consent_id_from_response = response.get("consent_id")

            # Определяем, что сохранить в consent_id
            if status == "approved":
                db_consent_value = consent_id_from_response
            elif status == "pending":
                db_consent_value = request_id
            else:
                db_consent_value = request_id or None

            # Обновляем БД
            cursor.execute("""
                UPDATE user_banks 
                SET consent_id = ? 
                WHERE user_name = ? AND bank_name = ?
            """, (db_consent_value, user_name, bank_name))

        except Exception as e:
            print(f"⚠️ Ошибка при создании согласия для банка {bank_name} пользователя {user_name}: {e}")
            continue

    conn.commit()
    conn.close()

def waiting_for_approval(user_name: str, bank_name: str, consent_id: str):
    """
    Заглушка: обработка случая, когда согласие ожидает подтверждения пользователем.
	Здесь будем формировать список банков для подтверждения и отправлять на фронт
    """
    print(f"⏳ Согласие {consent_id} для банка {bank_name} пользователя {user_name} ожидает подтверждения.")

# После этой функции повторно запускаем update_missing_consents для обработки случая истечения сроков согласия
def refresh_user_consents(user_name: str, your_bank_id: str = "team089", db_path: str = "users.db"):
    """
    Проверяет статус согласий для **всех активных банков** пользователя, у которых есть consent_id.
    Поддерживает:
      - req-... → переход в consent-...
      - consent-... → проверка срока действия и статуса
      - просроченные или отозванные → сброс consent_id в NULL
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Получаем ВСЕ активные банки с НЕПУСТЫМ consent_id
    cursor.execute("""
        SELECT bank_name, consent_id
        FROM user_banks
        WHERE user_name = ? AND is_active = 1 AND consent_id IS NOT NULL AND consent_id != ''
    """, (user_name,))
    
    consent_entries = cursor.fetchall()
    conn.close()

    if not consent_entries:
        return

    # Переподключаемся в цикле по одному, чтобы не держать долгое соединение
    for bank_name, consent_id in consent_entries:
        try:
            base_url = f"https://{bank_name}.open.bankingapi.ru"
            
            response = GetConsentByID(
                consent_id=consent_id,
                x_fapi_interaction_id=your_bank_id,
                base_url=base_url
            )

            data = response.get("data", {})
            actual_consent_id = data.get("consentId")  # может отличаться от запрашиваемого (например, req → consent)
            status = data.get("status")
            expiration_str = data.get("expirationDateTime")

            # Парсим expirationDateTime
            expiration_dt = None
            if expiration_str:
                # Обработка ISO 8601 с 'Z'
                dt_str = expiration_str.replace('Z', '+00:00')
                if '.' in dt_str and dt_str.count('.') == 1:
                    # Обрезаем до 6 цифр микросекунд, если нужно
                    main_part, micro = dt_str.split('.')
                    micro = micro.split('+')[0][:6].ljust(6, '0')
                    tz_part = dt_str.split('+')[-1]
                    dt_str = f"{main_part}.{micro}+00:00"
                expiration_dt = datetime.fromisoformat(dt_str)

            now = datetime.now(timezone.utc)

            # 1. Если срок истёк → сбрасываем consent_id
            if expiration_dt and now > expiration_dt:
                _update_consent_in_db(user_name, bank_name, None, db_path)
                print(f"⚠️ Согласие {consent_id} для {bank_name} просрочено. Удалено.")
                continue

            # 2. Обработка по статусу
            if status == "Authorized":
                # Используем actual_consent_id, даже если он отличается (например, был req-, стал consent-)
                if actual_consent_id and actual_consent_id.startswith("consent-"):
                    _update_consent_in_db(user_name, bank_name, actual_consent_id, db_path)
                    if actual_consent_id != consent_id:
                        print(f"✅ Согласие обновлено: {consent_id} → {actual_consent_id} для {bank_name}")
                    else:
                        print(f"✅ Согласие {actual_consent_id} для {bank_name} активно и валидно.")
                else:
                    print(f"⚠️ Статус Authorized, но consentId некорректен: {actual_consent_id}. Сбрасываем.")
                    _update_consent_in_db(user_name, bank_name, None, db_path)

            elif status in ("AwaitingAuthorization", "Pending", "Initiated"):
                waiting_for_approval(user_name, bank_name, consent_id)

            else:
                # Rejected, Revoked, Deleted и т.п.
                print(f"❌ Согласие {consent_id} для {bank_name} в статусе '{status}'. Сбрасываем.")
                _update_consent_in_db(user_name, bank_name, None, db_path)

        except Exception as e:
            print(f"❌ Ошибка при проверке согласия {consent_id} для банка {bank_name}: {e}")
            continue

def _update_consent_in_db(user_name: str, bank_name: str, new_consent_id: str | None, db_path: str):
    """Вспомогательная функция для обновления consent_id в БД."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE user_banks
        SET consent_id = ?
        WHERE user_name = ? AND bank_name = ?
    """, (new_consent_id, user_name, bank_name))
    conn.commit()
    conn.close() 

# Для дебага: печатает содержимое БД пользователя по имени
def print_user_banks_info(user_name: str, db_path: str = "users.db"):
    """
    Печатает информацию обо всех банках пользователя из базы данных.

    :param user_name: Имя пользователя
    :param db_path: Путь к файлу SQLite базы
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Получаем все записи пользователя
    cursor.execute("""
        SELECT bank_name, account_id, consent_id, is_active
        FROM user_banks
        WHERE user_name = ?
        ORDER BY bank_name
    """, (user_name,))
    
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print(f"ℹ️ Пользователь '{user_name}' не найден в базе данных.")
        return

    print(f"🏦 Информация о пользователе: {user_name}")
    print("-" * 80)
    print(f"{'Банк':<15} {'Активен':<8} {'Consent ID / Request ID':<30} {'Account ID(s)':<20}")
    print("-" * 80)

    for bank_name, account_id, consent_id, is_active in rows:
        status = "✅ Да" if is_active else "❌ Нет"
        consent = consent_id if consent_id else "—"
        accounts = account_id if account_id else "—"
        print(f"{bank_name:<15} {status:<8} {consent:<30} {accounts:<20}")

    print("-" * 80)
