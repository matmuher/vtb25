# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3
import hashlib
import os

# --- Database Setup ---
DB_NAME = "users.db"

def init_db():
    """Initialize the SQLite database, create the users table, and add a default user if none exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # The 'password' column will store the SHA-256 hash of the user's password
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Check if any users exist
    cursor.execute('SELECT COUNT(*) FROM users')
    user_count = cursor.fetchone()[0]
    
    if user_count == 0:
        # Hash the default password
        default_login = "testuser"
        default_password = "testpass" # Change this password before deploying!
        hashed_password = hash_password(default_password)
        
        # Insert the default user
        cursor.execute('INSERT INTO users (login, password) VALUES (?, ?)', (default_login, hashed_password))
        print(f"Added default user: {default_login}")
    
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    """Hash a password using SHA-512."""
    return hashlib.sha512(password.encode()).hexdigest()

def verify_user(login: str, password: str) -> bool:
    """Verify user credentials against the database."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    hashed_password = hash_password(password)
    cursor.execute('SELECT 1 FROM users WHERE login = ? AND password = ?', (login, hashed_password))
    result = cursor.fetchone()
    conn.close()
    return result is not None

# Initialize the database on startup
init_db()

# --- FastAPI App ---
app = FastAPI(title="Minimal Login API")

# IMPORTANT: Replace "http://localhost:3000" with your actual React frontend URL in production.
# Using ["*"] for origins is convenient for development but insecure for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Model ---
class LoginRequest(BaseModel):
    login: str
    password: str

class LoginResponse(BaseModel):
    message: str

# --- API Endpoint ---
@app.post("/api/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Handles user login requests.
    Expects a JSON body with 'login' and 'password' fields.
    Checks credentials against the SQLite database.
    """
    if verify_user(request.login, request.password):
        # In a real app, you would generate and return a secure session token here.
        # For this minimal example, we just confirm the login was successful.
        return LoginResponse(message="Login successful")
    else:
        # Return a 401 Unauthorized status if login fails
        raise HTTPException(status_code=401, detail="Invalid credentials")

# --- Main Execution (for running with uvicorn) ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
