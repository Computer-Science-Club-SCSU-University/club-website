from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
import hashlib
import html as html_lib
import re
from api.services import EventService
from api.services.google_calendar_service import GoogleCalendarService
from api.serializers import EventSerializer, EventCreateSerializer, EventUpdateSerializer


@api_view(['GET'])
def get_events(request):
    """Get all events (public endpoint)."""
    try:
        events = EventService.get_upcoming_events()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch events: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_google_events(request):
    """Get events directly from Google Calendar (read-through).

    Supports optional query params:
    - calendarId: override calendar id
    - maxResults: limit per list (applied separately to past and upcoming)
    - includePast: 'true' to include past events
    - includeUpcoming: 'true' to include upcoming events
    """
    try:
        calendar_id = request.query_params.get('calendarId')
        max_results_param = request.query_params.get('maxResults')
        max_results = int(max_results_param) if max_results_param else 10
        include_past = (request.query_params.get('includePast', 'true').lower() == 'true')
        include_upcoming = (request.query_params.get('includeUpcoming', 'true').lower() == 'true')

        items = []
        if include_upcoming:
            items.extend(GoogleCalendarService.list_upcoming_events(calendar_id=calendar_id, max_results=max_results))
        if include_past:
            # Fetch past events within the last 180 days by default
            items.extend(GoogleCalendarService.list_past_events(calendar_id=calendar_id, max_results=max_results, days_back=180))

        mapped = []
        now = timezone.now()
        for item in items:
            start = item.get('start', {})
            # Prefer dateTime; fallback to date (all-day)
            event_date_str = start.get('dateTime') or (start.get('date') + 'T00:00:00Z' if start.get('date') else None)
            is_upcoming = True
            if event_date_str:
                try:
                    # Use Django's timezone-aware comparison
                    event_dt = timezone.datetime.fromisoformat(event_date_str.replace('Z', '+00:00'))
                    if timezone.is_naive(event_dt):
                        event_dt = timezone.make_aware(event_dt, timezone.utc)
                    is_upcoming = event_dt > now
                except Exception:
                    is_upcoming = True

            # Deterministic numeric id from Google id (stable across runs)
            google_id = item.get('id', '')
            digest = hashlib.sha1(google_id.encode('utf-8')).hexdigest()
            numeric_id = int(digest[:8], 16)  # fits in 32-bit range

            raw_description = item.get('description')
            # Decode HTML entities and strip tags for plain-text description
            decoded_description = html_lib.unescape(raw_description) if raw_description else None
            plain_description = (
                re.sub(r'<[^>]+>', '', decoded_description).strip() if decoded_description else None
            )

            mapped.append({
                'id': numeric_id,
                'title': item.get('summary', ''),
                'description': plain_description,
                'location': item.get('location'),
                'event_date': event_date_str,
                'created_by': None,
                'created_at': item.get('created') or event_date_str,
                'updated_at': item.get('updated') or event_date_str,
                'is_upcoming': is_upcoming,
                'rsvp_count': 0,
                'max_attendees': None,
                'status': 'upcoming' if is_upcoming else 'past',
            })

        # Sort by event_date ascending
        mapped.sort(key=lambda e: e.get('event_date') or '')

        return Response(mapped)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch Google events: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_google_event_detail(request, event_id: int):
    """Get a single Google Calendar event by deterministic id."""
    try:
        calendar_id = request.query_params.get('calendarId')
        # Fetch both past and upcoming, reasonable upper bound
        items = []
        items.extend(GoogleCalendarService.list_upcoming_events(calendar_id=calendar_id, max_results=50))
        items.extend(GoogleCalendarService.list_past_events(calendar_id=calendar_id, max_results=50))

        now = timezone.now()
        for item in items:
            google_id = item.get('id', '')
            digest = hashlib.sha1(google_id.encode('utf-8')).hexdigest()
            numeric_id = int(digest[:8], 16)

            if numeric_id == event_id:
                start = item.get('start', {})
                event_date_str = start.get('dateTime') or (start.get('date') + 'T00:00:00Z' if start.get('date') else None)

                is_upcoming = True
                if event_date_str:
                    try:
                        event_dt = timezone.datetime.fromisoformat(event_date_str.replace('Z', '+00:00'))
                        if timezone.is_naive(event_dt):
                            event_dt = timezone.make_aware(event_dt, timezone.utc)
                        is_upcoming = event_dt > now
                    except Exception:
                        is_upcoming = True

                raw_description = item.get('description')
                decoded_description = html_lib.unescape(raw_description) if raw_description else None
                plain_description = (
                    re.sub(r'<[^>]+>', '', decoded_description).strip() if decoded_description else None
                )

                data = {
                    'id': numeric_id,
                    'title': item.get('summary', ''),
                    'description': plain_description,
                    'location': item.get('location'),
                    'event_date': event_date_str,
                    'created_by': None,
                    'created_at': item.get('created') or event_date_str,
                    'updated_at': item.get('updated') or event_date_str,
                    'is_upcoming': is_upcoming,
                    'rsvp_count': 0,
                    'max_attendees': None,
                    'status': 'upcoming' if is_upcoming else 'past',
                }
                return Response(data)

        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch Google event: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_event_detail(request, event_id):
    """Get event detail by ID (public endpoint)."""
    try:
        event = EventService.get_event_by_id(event_id)
        if not event:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = EventSerializer(event)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch event: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def create_event(request):
    """Create a new event (officer-only)."""
    if not request.user:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = EventCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            event = EventService.create_event(request.user, serializer.validated_data)
            response_serializer = EventSerializer(event)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Failed to create event: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def update_event(request, event_id):
    """Update an existing event (officer-only)."""
    if not request.user:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        event = EventService.get_event_by_id(event_id)
        if not event:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = EventUpdateSerializer(data=request.data)
        if serializer.is_valid():
            updated_event = EventService.update_event(event, serializer.validated_data)
            response_serializer = EventSerializer(updated_event)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'Failed to update event: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def delete_event(request, event_id):
    """Delete an event (officer-only)."""
    if not request.user:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        event = EventService.get_event_by_id(event_id)
        if not event:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        EventService.delete_event(event)
        return Response({'message': 'Event deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response(
            {'error': f'Failed to delete event: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 