from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.waitlist import (
    WaitlistCallResponse,
    WaitlistEntryCreate,
    WaitlistEntryResponse,
    WaitlistQueueResponse,
    DinerEntryResponse,
    DailyReportResponse,
)
from app.models.waitlist_entry import WaitlistStatus
from app.services import waitlist_service
from app.services.waitlist_service import (
    InvalidWaitlistStateError,
    RestaurantNotFoundError,
    WaitlistEntryNotFoundError,
)

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.get("/{restaurant_id}/entries/{entry_id}", response_model=DinerEntryResponse)
def get_diner_entry(restaurant_id: int = Path(gt=0), entry_id: int = Path(gt=0), db: Session = Depends(get_db)):
    try:
        return waitlist_service.get_entry(db, restaurant_id, entry_id)
    except WaitlistEntryNotFoundError:
        raise HTTPException(404, "Waitlist entry not found")


@router.get("/{restaurant_id}/report", response_model=DailyReportResponse)
def get_daily_report(restaurant_id: int = Path(gt=0), db: Session = Depends(get_db)):
    try:
        return waitlist_service.daily_report(db, restaurant_id)
    except RestaurantNotFoundError:
        raise HTTPException(404, "Restaurant not found")


def _transition(db: Session, entry_id: int, target: WaitlistStatus):
    try:
        return waitlist_service.transition_entry(db, entry_id, target)
    except WaitlistEntryNotFoundError:
        raise HTTPException(404, "Waitlist entry not found")
    except InvalidWaitlistStateError:
        raise HTTPException(409, "Esta acción ya no está disponible porque el turno cambió de estado.")


@router.post("/{entry_id}/leave", response_model=DinerEntryResponse)
def leave_entry(entry_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return _transition(db, entry_id, WaitlistStatus.LEFT)


@router.post("/{entry_id}/seat", response_model=DinerEntryResponse)
def seat_entry(entry_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return _transition(db, entry_id, WaitlistStatus.SEATED)


@router.post("/{entry_id}/no-show", response_model=DinerEntryResponse)
def no_show_entry(entry_id: int = Path(gt=0), db: Session = Depends(get_db)):
    return _transition(db, entry_id, WaitlistStatus.NO_SHOW)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=WaitlistEntryResponse,
)
def create_waitlist_entry(
    payload: WaitlistEntryCreate,
    db: Session = Depends(get_db),
):
    try:
        entry = waitlist_service.create_entry(db, payload)
    except RestaurantNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    return entry


@router.get(
    "/{restaurant_id}",
    response_model=WaitlistQueueResponse,
)
def get_waitlist_queue(
    restaurant_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    try:
        entries = waitlist_service.get_queue(db, restaurant_id)
    except RestaurantNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    return WaitlistQueueResponse(restaurant_id=restaurant_id, entries=entries)


@router.post(
    "/{entry_id}/call",
    response_model=WaitlistCallResponse,
)
def call_waitlist_entry(
    entry_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    try:
        entry = waitlist_service.call_entry(db, entry_id)
    except WaitlistEntryNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found",
        )
    except InvalidWaitlistStateError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Waitlist entry cannot be called because its status is "
                f"{exc.current_status.value}"
            ),
        )

    return entry
