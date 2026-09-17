from datetime import datetime, timezone, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.restaurant import Restaurant
from app.models.waitlist_entry import WaitlistEntry, WaitlistStatus
from app.schemas.waitlist import WaitlistEntryCreate
from app.db.database import settings


class RestaurantNotFoundError(Exception):
    pass


class WaitlistEntryNotFoundError(Exception):
    pass


class InvalidWaitlistStateError(Exception):
    def __init__(self, current_status: WaitlistStatus) -> None:
        self.current_status = current_status
        super().__init__(f"Invalid transition from {current_status.value}")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_restaurant(db: Session, restaurant_id: int) -> Restaurant:
    restaurant = db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise RestaurantNotFoundError()
    return restaurant


def _next_position(db: Session, restaurant_id: int) -> int:
    max_position = db.scalar(
        select(func.max(WaitlistEntry.position)).where(
            WaitlistEntry.restaurant_id == restaurant_id
        )
    )
    return (max_position or 0) + 1


def create_entry(db: Session, payload: WaitlistEntryCreate) -> WaitlistEntry:
    _get_restaurant(db, payload.restaurant_id)

    entry = WaitlistEntry(
        restaurant_id=payload.restaurant_id,
        name=payload.name,
        phone=payload.phone,
        party_size=payload.party_size,
        status=WaitlistStatus.WAITING,
        position=_next_position(db, payload.restaurant_id),
        called_at=None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_queue(db: Session, restaurant_id: int) -> list[WaitlistEntry]:
    _get_restaurant(db, restaurant_id)

    return list(
        db.scalars(
            select(WaitlistEntry)
            .where(
                WaitlistEntry.restaurant_id == restaurant_id,
                WaitlistEntry.status.in_(
                    (WaitlistStatus.WAITING, WaitlistStatus.CALLED)
                ),
            )
            .order_by(WaitlistEntry.position.asc())
        ).all()
    )


def call_entry(db: Session, entry_id: int) -> WaitlistEntry:
    return transition_entry(db, entry_id, WaitlistStatus.CALLED)


def get_entry(db: Session, restaurant_id: int, entry_id: int) -> WaitlistEntry:
    entry = db.get(WaitlistEntry, entry_id)
    if entry is None or entry.restaurant_id != restaurant_id:
        raise WaitlistEntryNotFoundError()
    return entry


TRANSITIONS = {
    WaitlistStatus.CALLED: WaitlistStatus.WAITING,
    WaitlistStatus.LEFT: WaitlistStatus.WAITING,
    WaitlistStatus.SEATED: WaitlistStatus.CALLED,
    WaitlistStatus.NO_SHOW: WaitlistStatus.CALLED,
}


def transition_entry(db: Session, entry_id: int, target: WaitlistStatus) -> WaitlistEntry:
    # Serialize competing actions on this entry (e.g. call versus leave).
    entry = db.scalar(select(WaitlistEntry).where(WaitlistEntry.id == entry_id).with_for_update())
    if entry is None:
        raise WaitlistEntryNotFoundError()

    if entry.status != TRANSITIONS[target]:
        raise InvalidWaitlistStateError(entry.status)

    entry.status = target
    if target == WaitlistStatus.CALLED:
        entry.called_at = _utcnow()
    db.commit()
    db.refresh(entry)
    return entry


def daily_report(db: Session, restaurant_id: int) -> dict:
    restaurant = _get_restaurant(db, restaurant_id)
    zone = ZoneInfo(settings.APP_TIMEZONE)
    day = _utcnow().astimezone(zone).date()
    start = datetime.combine(day, time.min, zone).astimezone(timezone.utc)
    end = datetime.combine(day + timedelta(days=1), time.min, zone).astimezone(timezone.utc)
    # MySQL DATETIME stores our UTC values without timezone metadata.
    entries = list(db.scalars(select(WaitlistEntry).where(
        WaitlistEntry.restaurant_id == restaurant_id,
        WaitlistEntry.joined_at >= start.replace(tzinfo=None),
        WaitlistEntry.joined_at < end.replace(tzinfo=None),
    )))
    waits = [(entry.called_at - entry.joined_at).total_seconds() / 60
             for entry in entries if entry.called_at is not None]
    return {
        "restaurant_id": restaurant.id, "restaurant_name": restaurant.name,
        "date": day, "timezone": settings.APP_TIMEZONE,
        "joined": len(entries),
        "seated": sum(e.status == WaitlistStatus.SEATED for e in entries),
        "left": sum(e.status == WaitlistStatus.LEFT for e in entries),
        "no_show": sum(e.status == WaitlistStatus.NO_SHOW for e in entries),
        "average_wait_minutes": round(sum(waits) / len(waits), 1) if waits else None,
    }
