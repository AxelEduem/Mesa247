from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WaitlistStatus(str, Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    SEATED = "SEATED"
    LEFT = "LEFT"
    NO_SHOW = "NO_SHOW"


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"
    __table_args__ = (
        CheckConstraint("party_size > 0", name="ck_waitlist_entries_party_size_positive"),
        CheckConstraint("position > 0", name="ck_waitlist_entries_position_positive"),
        Index(
            "ix_waitlist_entries_restaurant_status_position",
            "restaurant_id",
            "status",
            "position",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[WaitlistStatus] = mapped_column(
        SqlEnum(
            WaitlistStatus,
            name="waitlist_status",
            native_enum=False,
            length=20,
        ),
        nullable=False,
        default=WaitlistStatus.WAITING,
        server_default=WaitlistStatus.WAITING.value,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )
    called_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    restaurant: Mapped["Restaurant"] = relationship(
        back_populates="waitlist_entries",
    )
