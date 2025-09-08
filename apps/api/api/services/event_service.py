from django.db import transaction
from django.utils import timezone
from api.models import Event
class EventService:
    """
    Service layer for Event operations.
    All business logic for events should be implemented here.
    """
    
    @staticmethod
    def get_all_events():
        """Get all events ordered by date."""
        return Event.objects.all().select_related('created_by')
    
    @staticmethod
    def get_upcoming_events():
        """Get all upcoming events."""
        return Event.objects.filter(
            event_date__gt=timezone.now()
        ).select_related('created_by').order_by('event_date')
    
    @staticmethod
    def get_event_by_id(event_id):
        """Get a specific event by ID."""
        try:
            return Event.objects.select_related('created_by').get(id=event_id)
        except Event.DoesNotExist:
            return None
    
    @staticmethod
    @transaction.atomic
    def create_event(user, event_data):
        """Create a new event."""
        event = Event.objects.create(
            title=event_data['title'],
            description=event_data.get('description'),
            location=event_data.get('location'),
            event_date=event_data['event_date'],
            created_by=user
        )
        return event
    
    @staticmethod
    @transaction.atomic
    def update_event(event, event_data):
        """Update an existing event."""
        allowed_fields = ['title', 'description', 'location', 'event_date']
        
        for field, value in event_data.items():
            if field in allowed_fields and value is not None:
                setattr(event, field, value)
        
        event.save()
        return event
    
    @staticmethod
    @transaction.atomic
    def delete_event(event):
        """Delete an event."""
        event.delete()
        return True
    
    @staticmethod
    def get_events_with_rsvp_counts():
        """Get all events with RSVP counts."""
        from django.db.models import Count
        return Event.objects.annotate(
            rsvp_count=Count('rsvps')
        ).select_related('created_by').order_by('event_date') 
        