"""
URL Configuration for CS Club backend.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'CS Club API is running'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    path('health', health_check, name='health_check'),
    path('api/', include('api.urls')),
] 