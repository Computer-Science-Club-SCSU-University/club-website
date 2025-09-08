from django.urls import path
from api.views import event_views, rsvp_views

urlpatterns = [
    # Event management
    path('', event_views.get_events, name='get_events'),
    path('google/', event_views.get_google_events, name='get_google_events'),
    path('google/<int:event_id>/', event_views.get_google_event_detail, name='get_google_event_detail'),
    path('create/', event_views.create_event, name='create_event'),
    path('<int:event_id>/', event_views.get_event_detail, name='get_event_detail'),
    path('<int:event_id>/update/', event_views.update_event, name='update_event'),
    path('<int:event_id>/delete/', event_views.delete_event, name='delete_event'),
    
    # RSVP endpoints
    path('<int:event_id>/rsvp/', rsvp_views.create_event_rsvp, name='create_event_rsvp'),
    path('<int:event_id>/rsvps/', rsvp_views.get_event_rsvps, name='get_event_rsvps'),
] 