from datetime import datetime, date, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.waitlist_entry import WaitlistStatus


class UTCResponse(BaseModel):
    @field_validator("joined_at", "called_at", mode="after", check_fields=False)
    @classmethod
    def utc_dates(cls, value: datetime | None) -> datetime | None:
        return value.replace(tzinfo=timezone.utc) if value and value.tzinfo is None else value


class WaitlistEntryCreate(BaseModel):
    restaurant_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=32)
    party_size: int = Field(gt=0)

    @field_validator("name", "phone")
    @classmethod
    def strip_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be empty")
        return value


class WaitlistEntryResponse(UTCResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    name: str
    party_size: int
    status: WaitlistStatus
    position: int
    joined_at: datetime
    called_at: datetime | None


class WaitlistQueueResponse(BaseModel):
    restaurant_id: int
    entries: list[WaitlistEntryResponse]


class WaitlistCallResponse(UTCResponse):
    """Payload reducido del contrato de llamada; no hace falta reenviar toda la entrada."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: WaitlistStatus
    called_at: datetime


class DinerEntryResponse(UTCResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    party_size: int
    status: WaitlistStatus
    position: int
    joined_at: datetime
    called_at: datetime | None


class DailyReportResponse(BaseModel):
    restaurant_id: int
    restaurant_name: str
    date: date
    timezone: str
    joined: int
    seated: int
    left: int
    no_show: int
    average_wait_minutes: float | None
