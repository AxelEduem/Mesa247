from datetime import datetime, timedelta, timezone

import pytest

from app.db.database import settings
from app.models.waitlist_entry import WaitlistEntry, WaitlistStatus
from app.services import waitlist_service


def join(client, restaurant_id):
    response = client.post("/api/v1/waitlist", json={
        "restaurant_id": restaurant_id, "name": "Demo", "phone": "+51999999999", "party_size": 2,
    })
    assert response.status_code == 201
    return response.json()["id"]


@pytest.mark.parametrize("action,source,target", [
    ("call", "WAITING", "CALLED"), ("leave", "WAITING", "LEFT"),
    ("seat", "CALLED", "SEATED"), ("no-show", "CALLED", "NO_SHOW"),
])
def test_transitions_and_diner_contract(client, restaurant, action, source, target):
    entry_id = join(client, restaurant.id)
    if source == "CALLED":
        assert client.post(f"/api/v1/waitlist/{entry_id}/call").status_code == 200
    response = client.post(f"/api/v1/waitlist/{entry_id}/{action}")
    assert response.status_code == 200
    assert response.json()["status"] == target
    detail = client.get(f"/api/v1/waitlist/{restaurant.id}/entries/{entry_id}")
    assert detail.status_code == 200
    assert detail.json()["status"] == target
    assert set(detail.json()) == {"id", "restaurant_id", "party_size", "position", "status", "joined_at", "called_at"}
    assert detail.json()["joined_at"].endswith("Z")
    if source == "CALLED" or action == "call":
        assert detail.json()["called_at"].endswith("Z")
    queue = client.get(f"/api/v1/waitlist/{restaurant.id}").json()["entries"]
    assert (entry_id in [e["id"] for e in queue]) == (target == "CALLED")
    assert join(client, restaurant.id) > entry_id
    assert client.get(f"/api/v1/waitlist/{restaurant.id}").json()["entries"][-1]["position"] == 2


@pytest.mark.parametrize("action,allowed", [("call", "WAITING"), ("leave", "WAITING"), ("seat", "CALLED"), ("no-show", "CALLED")])
@pytest.mark.parametrize("source", list(WaitlistStatus))
def test_state_matrix(client, db, restaurant, action, allowed, source):
    entry_id = join(client, restaurant.id)
    db.commit()
    entry = db.get(WaitlistEntry, entry_id)
    entry.status = source
    db.commit()
    response = client.post(f"/api/v1/waitlist/{entry_id}/{action}")
    assert response.status_code == (200 if source.value == allowed else 409)
    if source.value != allowed:
        db.expire_all()
        assert db.get(WaitlistEntry, entry_id).status == source


@pytest.mark.parametrize("action", ["leave", "seat", "no-show"])
def test_missing_action_entry(client, action):
    assert client.post(f"/api/v1/waitlist/999999/{action}").status_code == 404


def test_missing_restaurant_on_join_and_report(client):
    response = client.post("/api/v1/waitlist", json={
        "restaurant_id": 999999, "name": "Demo", "phone": "123", "party_size": 1,
    })
    assert response.status_code == 404
    assert client.get("/api/v1/waitlist/999999/report").status_code == 404


def test_diner_isolation(client, restaurant, restaurant_b):
    entry_id = join(client, restaurant.id)
    assert client.get(f"/api/v1/waitlist/{restaurant_b.id}/entries/{entry_id}").status_code == 404
    assert client.get(f"/api/v1/waitlist/{restaurant.id}/entries/999999").status_code == 404


def test_empty_report(client, restaurant):
    response = client.get(f"/api/v1/waitlist/{restaurant.id}/report")
    assert response.status_code == 200
    body = response.json()
    assert body["joined"] == body["seated"] == body["left"] == body["no_show"] == 0
    assert body["average_wait_minutes"] is None


def test_report_calendar_boundaries_mean_and_isolation(client, db, restaurant, restaurant_b, monkeypatch):
    # 02:00 UTC on Sep 18 is still Sep 17 in Lima.
    monkeypatch.setattr(waitlist_service, "_utcnow", lambda: datetime(2026, 9, 18, 2, tzinfo=timezone.utc))
    monkeypatch.setattr(settings, "APP_TIMEZONE", "America/Lima")
    start = datetime(2026, 9, 17, 5)
    end = start + timedelta(days=1)
    records = [
        (restaurant.id, start, "SEATED", 10),
        (restaurant.id, end - timedelta(minutes=40), "NO_SHOW", 30),
        (restaurant.id, start + timedelta(hours=1), "LEFT", None),
        (restaurant.id, start + timedelta(hours=2), "WAITING", None),
        (restaurant.id, start + timedelta(hours=3), "CALLED", 20),
        (restaurant.id, start - timedelta(seconds=1), "SEATED", 100),
        (restaurant.id, end, "SEATED", 100),
        (restaurant_b.id, start, "SEATED", 100),
    ]
    for position, (rid, joined_at, status, wait) in enumerate(records, 1):
        db.add(WaitlistEntry(restaurant_id=rid, name="Demo", phone="123", party_size=2,
                            position=position, status=WaitlistStatus(status), joined_at=joined_at,
                            called_at=joined_at + timedelta(minutes=wait) if wait is not None else None))
    db.commit()
    body = client.get(f"/api/v1/waitlist/{restaurant.id}/report").json()
    assert body == {"restaurant_id": restaurant.id, "restaurant_name": restaurant.name,
                    "date": "2026-09-17", "timezone": "America/Lima", "joined": 5,
                    "seated": 1, "left": 1, "no_show": 1, "average_wait_minutes": 20.0}


def test_complete_demo_flow(client, restaurant, monkeypatch):
    monkeypatch.setattr(waitlist_service, "_utcnow", lambda: datetime.now(timezone.utc))
    a, b, c = [join(client, restaurant.id) for _ in range(3)]
    for entry_id, action in [(a, "seat"), (b, "no-show")]:
        assert client.post(f"/api/v1/waitlist/{entry_id}/call").status_code == 200
        assert client.post(f"/api/v1/waitlist/{entry_id}/{action}").status_code == 200
    assert client.post(f"/api/v1/waitlist/{c}/leave").status_code == 200
    assert client.get(f"/api/v1/waitlist/{restaurant.id}").json()["entries"] == []
    report = client.get(f"/api/v1/waitlist/{restaurant.id}/report").json()
    assert report["joined"] == 3
    assert report["seated"] == report["no_show"] == report["left"] == 1
    assert report["average_wait_minutes"] is not None
