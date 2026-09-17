import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.restaurant import Restaurant
from app.models.waitlist_entry import WaitlistEntry, WaitlistStatus


def _create_entry(client: TestClient, restaurant_id: int, name: str, party_size: int = 2):
    return client.post(
        "/api/v1/waitlist",
        json={
            "restaurant_id": restaurant_id,
            "name": name,
            "phone": "+51987654321",
            "party_size": party_size,
        },
    )


def test_create_entry(client: TestClient, restaurant: Restaurant):
    response = _create_entry(client, restaurant.id, "Carla", party_size=4)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Carla"
    assert body["party_size"] == 4
    assert body["status"] == "WAITING"
    assert body["called_at"] is None
    assert body["restaurant_id"] == restaurant.id


def test_first_entry_gets_position_one(client: TestClient, restaurant: Restaurant):
    response = _create_entry(client, restaurant.id, "Carla")

    assert response.status_code == 201
    assert response.json()["position"] == 1


def test_second_entry_gets_later_position(client: TestClient, restaurant: Restaurant):
    first = _create_entry(client, restaurant.id, "Carla")
    second = _create_entry(client, restaurant.id, "Luis")

    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["position"] == first.json()["position"] + 1


def test_queue_returns_entries_ordered_by_position(
    client: TestClient, restaurant: Restaurant
):
    _create_entry(client, restaurant.id, "Carla")
    _create_entry(client, restaurant.id, "Luis")

    response = client.get(f"/api/v1/waitlist/{restaurant.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["restaurant_id"] == restaurant.id
    names = [entry["name"] for entry in body["entries"]]
    positions = [entry["position"] for entry in body["entries"]]
    assert names == ["Carla", "Luis"]
    assert positions == sorted(positions)


def test_call_changes_waiting_to_called(client: TestClient, restaurant: Restaurant):
    created = _create_entry(client, restaurant.id, "Carla")
    entry_id = created.json()["id"]

    response = client.post(f"/api/v1/waitlist/{entry_id}/call")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == entry_id
    assert body["status"] == "CALLED"
    assert body["called_at"] is not None


def test_cannot_call_already_called_entry(client: TestClient, restaurant: Restaurant):
    created = _create_entry(client, restaurant.id, "Carla")
    entry_id = created.json()["id"]

    first_call = client.post(f"/api/v1/waitlist/{entry_id}/call")
    second_call = client.post(f"/api/v1/waitlist/{entry_id}/call")

    assert first_call.status_code == 200
    assert second_call.status_code == 409


def test_missing_restaurant_returns_404(client: TestClient):
    response = client.get("/api/v1/waitlist/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Restaurant not found"


def test_missing_entry_returns_404(client: TestClient):
    response = client.post("/api/v1/waitlist/999999/call")

    assert response.status_code == 404
    assert response.json()["detail"] == "Waitlist entry not found"


def test_invalid_party_size_returns_422(client: TestClient, restaurant: Restaurant):
    response = client.post(
        "/api/v1/waitlist",
        json={
            "restaurant_id": restaurant.id,
            "name": "Carla",
            "phone": "+51987654321",
            "party_size": 0,
        },
    )

    assert response.status_code == 422


QUEUE_ENTRY_FIELDS = {
    "id",
    "restaurant_id",
    "name",
    "party_size",
    "status",
    "position",
    "joined_at",
    "called_at",
}
CALL_RESPONSE_FIELDS = {"id", "status", "called_at"}


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": ""},
        {"name": "   "},
        {"phone": ""},
        {"phone": "   "},
        {"party_size": -1},
        {"restaurant_id": 0},
        {"restaurant_id": -1},
    ],
)
def test_invalid_create_payload_returns_422(
    client: TestClient, restaurant: Restaurant, overrides: dict
):
    payload = {
        "restaurant_id": restaurant.id,
        "name": "Carla",
        "phone": "+51987654321",
        "party_size": 4,
    }
    payload.update(overrides)

    response = client.post("/api/v1/waitlist", json=payload)

    assert response.status_code == 422


def test_queue_is_isolated_by_restaurant(
    client: TestClient, restaurant: Restaurant, restaurant_b: Restaurant
):
    _create_entry(client, restaurant.id, "Carla")
    _create_entry(client, restaurant.id, "Jorge")
    _create_entry(client, restaurant_b.id, "Pedro")

    response = client.get(f"/api/v1/waitlist/{restaurant.id}")

    assert response.status_code == 200
    names = [entry["name"] for entry in response.json()["entries"]]
    assert names == ["Carla", "Jorge"]
    assert "Pedro" not in names


@pytest.mark.parametrize(
    "status",
    [WaitlistStatus.SEATED, WaitlistStatus.LEFT, WaitlistStatus.NO_SHOW],
)
def test_cannot_call_entry_in_terminal_status(
    client: TestClient,
    restaurant: Restaurant,
    db: Session,
    status: WaitlistStatus,
):
    created = _create_entry(client, restaurant.id, "Carla")
    entry_id = created.json()["id"]

    db.commit()
    entry = db.get(WaitlistEntry, entry_id)
    assert entry is not None
    entry.status = status
    db.commit()

    response = client.post(f"/api/v1/waitlist/{entry_id}/call")

    assert response.status_code == 409


def test_active_queue_includes_waiting_and_called_only(
    client: TestClient, restaurant: Restaurant, db: Session
):
    waiting = _create_entry(client, restaurant.id, "Carla")
    called = _create_entry(client, restaurant.id, "Jorge")
    seated = _create_entry(client, restaurant.id, "Ana")

    client.post(f"/api/v1/waitlist/{called.json()['id']}/call")

    db.commit()
    seated_entry = db.get(WaitlistEntry, seated.json()["id"])
    assert seated_entry is not None
    seated_entry.status = WaitlistStatus.SEATED
    db.commit()

    response = client.get(f"/api/v1/waitlist/{restaurant.id}")
    body = response.json()["entries"]
    names = [entry["name"] for entry in body]
    statuses = [entry["status"] for entry in body]

    assert names == ["Carla", "Jorge"]
    assert statuses == ["WAITING", "CALLED"]
    assert waiting.json()["id"] in {entry["id"] for entry in body}


def test_get_queue_does_not_change_position(
    client: TestClient, restaurant: Restaurant
):
    created = _create_entry(client, restaurant.id, "Carla")
    original_position = created.json()["position"]

    first = client.get(f"/api/v1/waitlist/{restaurant.id}")
    second = client.get(f"/api/v1/waitlist/{restaurant.id}")

    assert first.json()["entries"][0]["position"] == original_position
    assert second.json()["entries"][0]["position"] == original_position


def test_sequential_positions_are_one_two_three(
    client: TestClient, restaurant: Restaurant
):
    first = _create_entry(client, restaurant.id, "Carla")
    second = _create_entry(client, restaurant.id, "Jorge")
    third = _create_entry(client, restaurant.id, "Pedro")

    assert first.json()["position"] == 1
    assert second.json()["position"] == 2
    assert third.json()["position"] == 3


def test_queue_response_matches_public_contract(
    client: TestClient, restaurant: Restaurant
):
    created = _create_entry(client, restaurant.id, "Carla", party_size=4)

    assert "phone" not in created.json()
    assert created.json()["joined_at"]
    assert isinstance(created.json()["joined_at"], str)

    response = client.get(f"/api/v1/waitlist/{restaurant.id}")
    entry = response.json()["entries"][0]

    assert set(entry.keys()) == QUEUE_ENTRY_FIELDS
    assert "phone" not in entry
    assert "_sa_instance_state" not in entry
    assert isinstance(entry["joined_at"], str)
    assert entry["called_at"] is None


def test_call_response_matches_public_contract(
    client: TestClient, restaurant: Restaurant
):
    created = _create_entry(client, restaurant.id, "Carla")
    response = client.post(f"/api/v1/waitlist/{created.json()['id']}/call")

    body = response.json()
    assert set(body.keys()) == CALL_RESPONSE_FIELDS
    assert "phone" not in body
    assert isinstance(body["called_at"], str)
