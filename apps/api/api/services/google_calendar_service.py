import os
import json
import base64
import datetime
from typing import Any, Dict, List

from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


class GoogleCalendarService:
    """
    Integration service for fetching events from Google Calendar.

    This service is read-only and does not persist data to the database.
    """

    @staticmethod
    def list_events(
        calendar_id: str | None = None,
        *,
        time_min_iso: str | None = None,
        time_max_iso: str | None = None,
        max_results: int = 10,
    ) -> List[Dict[str, Any]]:
        service_account_json_b64 = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_B64")
        if not service_account_json_b64:
            raise RuntimeError("Missing GOOGLE_SERVICE_ACCOUNT_JSON_B64 environment variable")

        service_account_info = json.loads(base64.b64decode(service_account_json_b64))
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES
        )

        service = build("calendar", "v3", credentials=credentials)
        calendar_id_to_use = calendar_id or os.getenv("GOOGLE_CALENDAR_ID")
        if not calendar_id_to_use:
            raise RuntimeError("Missing GOOGLE_CALENDAR_ID environment variable")

        params: Dict[str, Any] = {
            "calendarId": calendar_id_to_use,
            "singleEvents": True,
            "orderBy": "startTime",
            "maxResults": max_results,
        }
        if time_min_iso:
            params["timeMin"] = time_min_iso
        if time_max_iso:
            params["timeMax"] = time_max_iso

        response = (
            service.events()
            .list(**params)
            .execute()
        )

        return response.get("items", [])

    @staticmethod
    def list_upcoming_events(calendar_id: str | None = None, max_results: int = 10) -> List[Dict[str, Any]]:
        now_iso = datetime.datetime.utcnow().isoformat() + "Z"
        return GoogleCalendarService.list_events(
            calendar_id=calendar_id,
            time_min_iso=now_iso,
            max_results=max_results,
        )

    @staticmethod
    def list_past_events(calendar_id: str | None = None, max_results: int = 10, *, days_back: int = 365) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        now_iso = now.isoformat() + "Z"
        time_min_iso = (now - datetime.timedelta(days=days_back)).isoformat() + "Z"
        return GoogleCalendarService.list_events(
            calendar_id=calendar_id,
            time_min_iso=time_min_iso,
            time_max_iso=now_iso,
            max_results=max_results,
        )


