from django.urls import path
from api.views import officer_views

urlpatterns = [
    path('', officer_views.get_officers, name='get_officers'),  # Public - all officers
    path('create/', officer_views.create_officer, name='create_officer'),
    path('<int:officer_id>/', officer_views.get_officer_by_id, name='get_officer_by_id'),
    path('<int:officer_id>/update/', officer_views.update_officer, name='update_officer'),
    path('<int:officer_id>/delete/', officer_views.delete_officer, name='delete_officer'),
    path('reorder/', officer_views.reorder_officers, name='reorder_officers'),
] 