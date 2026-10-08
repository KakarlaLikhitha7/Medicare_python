"""
Database connection and schema setup for MySQL Doctor Appointment System
"""

import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "doctor_appointment_db")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))

try:
    db_pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        port=MYSQL_PORT,
    )
except Exception as e:
    print(f"Notice: MySQL connection pool not initialized (ensure MySQL server is running): {e}")
    db_pool = None

def get_db_connection():
    """Retrieve connection from pool or direct connect"""
    if db_pool:
        return db_pool.get_connection()
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        port=MYSQL_PORT,
    )
