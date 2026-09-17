"""Ejecuta database/seed.sql contra MySQL. No modifica el código de FastAPI."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
SEED = ROOT / "database" / "seed.sql"

os.chdir(BACKEND)
sys.path.insert(0, str(BACKEND))

import pymysql
from app.db.database import settings


def statements_from_sql(sql: str) -> list[str]:
    lines = [line for line in sql.splitlines() if line.strip() and not line.strip().startswith("--")]
    return [part.strip() for part in "\n".join(lines).split(";") if part.strip()]


def main() -> None:
    sql = SEED.read_text(encoding="utf-8")
    connection = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    try:
        with connection.cursor() as cursor:
            for statement in statements_from_sql(sql):
                cursor.execute(statement)
        connection.commit()
        print("Seed aplicado: restaurants.id=1 La Terraza Azul / Lima")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
