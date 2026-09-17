import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.main import app
from app.models.restaurant import Restaurant
from app.models.waitlist_entry import WaitlistEntry


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def db() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _create_restaurant(db: Session, name: str) -> Restaurant:
    record = Restaurant(name=name, city="Lima")
    db.add(record)
    db.commit()
    db.refresh(record)
    db.commit()
    return record


def _delete_restaurant(db: Session, record: Restaurant) -> None:
    db.query(WaitlistEntry).filter(
        WaitlistEntry.restaurant_id == record.id
    ).delete()
    db.delete(record)
    db.commit()


@pytest.fixture
def restaurant(db: Session) -> Restaurant:
    record = _create_restaurant(db, "Mesa247 Test Restaurant")
    try:
        yield record
    finally:
        _delete_restaurant(db, record)


@pytest.fixture
def restaurant_b(db: Session) -> Restaurant:
    record = _create_restaurant(db, "Mesa247 Test Restaurant B")
    try:
        yield record
    finally:
        _delete_restaurant(db, record)
