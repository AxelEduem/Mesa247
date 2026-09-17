from fastapi import FastAPI
from sqlalchemy import text

from app.api.waitlist import router as waitlist_router
from app.db.database import engine


app = FastAPI(
    title="Mesa247 Waitlist API",
    version="0.1.0",
)

app.include_router(waitlist_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "mesa247-api",
    }


@app.get("/health/db")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }