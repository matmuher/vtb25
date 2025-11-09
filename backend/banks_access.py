import requests
import sqlite3
from datetime import datetime, timedelta
import json

def parse_banks_json(file_path: str):
    """
    Читает JSON-файл, содержащий список банков с учётными данными,
    и возвращает словарь в формате BANK_CREDENTIALS.

    Args:
        file_path (str): Путь к JSON-файлу.

    Returns:
        dict: Словарь, где ключ - имя банка, а значение - словарь с client_id и client_secret.
              Возвращает пустой словарь в случае ошибки или если файл пуст.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Проверяем, что загруженный объект - это список
        if not isinstance(data, list):
            print(f"Ошибка: Ожидается JSON-массив, но получен {type(data).__name__}.")
            return {}

        # Создаём результирующий словарь
        bank_credentials = {}
        for item in data:
            # Проверяем, что элемент - словарь и содержит нужные ключи
            if isinstance(item, dict) and 'bank_name' in item and 'client_id' in item and 'client_secret' in item:
                bank_name = item['bank_name']
                # Добавляем в словарь с bank_name как ключом
                bank_credentials[bank_name] = {
                    'client_id': item['client_id'],
                    'client_secret': item['client_secret']
                }
            else:
                print(f"Предупреждение: Пропущен элемент с недостаточными данными: {item}")

        return bank_credentials

    except FileNotFoundError:
        print(f"Ошибка: Файл {file_path} не найден.")
        return {}
    except json.JSONDecodeError as e:
        print(f"Ошибка: Неверный формат JSON в файле {file_path}. {e}")
        return {}
    except Exception as e:
        print(f"Неизвестная ошибка при чтении файла {file_path}: {e}")
        return {}

def get_bank_access_token(bank: str, client_id: str, client_secret: str) -> bool:
    """
    Предполагается, что эта функция реализована, как в предыдущем ответе.
    Она делает запрос к API банка и сохраняет токен в БД.
    """

    base_url = f"https://{bank}.open.bankingapi.ru/auth/bank-token"
    params = {
        'client_id': client_id,
        'client_secret': client_secret
    }

    try:
        response = requests.post(
            url=base_url,
            params=params,
            headers={'accept': 'application/json'},
            data=''
        )
        response.raise_for_status()

        data = response.json()

        access_token = data.get('access_token')
        token_type = data.get('token_type')
        retrieved_client_id = data.get('client_id')
        algorithm = data.get('algorithm')
        expires_in = data.get('expires_in')

        if not all([access_token, token_type, retrieved_client_id, algorithm, expires_in]):
            print("Ошибка: Ответ API не содержит всех ожидаемых полей.")
            return False

        add_time = datetime.now()

        conn = sqlite3.connect('bank_tokens.db')
        cursor = conn.cursor()

		# Создаём таблицу, если она не существует
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bank_name TEXT NOT NULL,
                access_token TEXT NOT NULL,
                token_type TEXT NOT NULL,
                client_id TEXT NOT NULL,
                algorithm TEXT,
                expires_in INTEGER,
                add_time DATETIME NOT NULL
            )
        ''')

        cursor.execute('''
            INSERT OR REPLACE INTO tokens (
                bank_name, access_token, token_type, client_id, algorithm, expires_in, add_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (bank, access_token, token_type, retrieved_client_id, algorithm, expires_in, add_time))

        conn.commit()
        conn.close()

        print(f"Токен для банка {bank} успешно получен и сохранён/обновлён.")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Ошибка при выполнении запроса для {bank}: {e}")
        return False
    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных для {bank}: {e}")
        return False
    except Exception as e:
        print(f"Неизвестная ошибка при обновлении токена для {bank}: {e}")
        return False


def update_expired_tokens():
    """
    Проверяет срок действия токенов в БД для поддерживаемых банков.
    Если токен истёк, вызывает get_bank_access_token для его обновления.
    """
    # Получаем список поддерживаемых банков из словаря
    BANK_CREDENTIALS = parse_banks_json("credentials.json")
    supported_banks = BANK_CREDENTIALS.keys()

    try:
        conn = sqlite3.connect('bank_tokens.db')
        cursor = conn.cursor()

        for bank in supported_banks:
            print(f"Проверяем токен для банка: {bank}")
            
            # Получаем информацию о токене из БД
            cursor.execute('''
                SELECT expires_in, add_time FROM tokens WHERE bank_name = ?
            ''', (bank,))
            
            row = cursor.fetchone()

            if row:
                expires_in, add_time_str = row
                # Преобразуем строку времени в объект datetime
                try:
                    # Пытаемся использовать fromisoformat (работает для стандартных форматов)
                    add_time = datetime.fromisoformat(add_time_str.replace(' ', 'T'))
                except ValueError:
                    # Если fromisoformat не сработал, можно попробовать strptime с конкретным форматом
                    # Например, если формат всегда такой: "%Y-%m-%d %H:%M:%S.%f"
                    try:
                        add_time = datetime.strptime(add_time_str, "%Y-%m-%d %H:%M:%S.%f")
                    except ValueError:
                        # Если и это не сработает, пробуем без микросекунд
                        add_time = datetime.strptime(add_time_str, "%Y-%m-%d %H:%M:%S")
                
                # Вычисляем время истечения
                expiration_time = add_time + timedelta(seconds=expires_in)
                current_time = datetime.now()

                if current_time >= expiration_time:
                    print(f"  -> Токен для {bank} истёк (истёк {expiration_time}). Обновляем...")
                    credentials = BANK_CREDENTIALS.get(bank)
                    if credentials:
                        success = get_bank_access_token(
                            bank=bank,
                            client_id=credentials['client_id'],
                            client_secret=credentials['client_secret']
                        )
                        if success:
                            print(f"  -> Токен для {bank} успешно обновлён.")
                        else:
                            print(f"  -> Не удалось обновить токен для {bank}.")
                    else:
                        print(f"  -> Учётные данные для банка {bank} не найдены в BANK_CREDENTIALS.")
                else:
                    print(f"  -> Токен для {bank} действителен до {expiration_time}.")
            else:
                print(f"  -> Запись для банка {bank} не найдена в БД. Получаем новый токен...")
                credentials = BANK_CREDENTIALS.get(bank)
                if credentials:
                    success = get_bank_access_token(
                        bank=bank,
                        client_id=credentials['client_id'],
                        client_secret=credentials['client_secret']
                    )
                    if success:
                        print(f"  -> Новый токен для {bank} успешно получен и сохранён.")
                    else:
                        print(f"  -> Не удалось получить токен для {bank}.")
                else:
                    print(f"  -> Учётные данные для банка {bank} не найдены в BANK_CREDENTIALS.")

        conn.close()

    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных: {e}")
    except Exception as e:
        print(f"Неизвестная ошибка: {e}")

def print_bank_tokens():
    """
    Подключается к базе данных SQLite и выводит все записи из таблицы 'tokens' в консоль.
    """
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect('bank_tokens.db')
        cursor = conn.cursor()

        # Выполняем SELECT-запрос
        cursor.execute('SELECT bank_name, access_token, token_type, client_id, algorithm, expires_in, add_time FROM tokens')

        # Получаем имена столбцов для заголовка
        column_names = [description[0] for description in cursor.description]

        # Печатаем заголовок
        header = " | ".join(f"{name:15}" for name in column_names)
        print(header)
        print("-" * len(header))

        # Извлекаем все строки
        rows = cursor.fetchall()

        # Печатаем каждую строку
        for row in rows:
            # Для аккуратного вывода, возможно, стоит обрезать слишком длинные токены
            formatted_row = " | ".join(f"{str(value):15}" for value in row)
            print(formatted_row)

        # Закрываем соединение
        conn.close()

        if not rows:
            print("Таблица 'tokens' пуста.")

    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных: {e}")
    except Exception as e:
        print(f"Неизвестная ошибка: {e}")

