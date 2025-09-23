import json
import requests
from django.conf import settings
from django.http import JsonResponse
from api.models import User


class ClerkAuthMiddleware:
    """
    Middleware to handle Clerk authentication for CS Club officers.
    
    Extracts clerk_user_id from request headers and maps to User model.
    Automatically creates officer in DB if not already present.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip auth for system endpoints (health checks)
        system_paths = [
            '/health',
            '/health/',
        ]

        if request.path.startswith('/health') or request.path.startswith('/admin/'):
            request.user = None
            return self.get_response(request)
        
        # Skip auth for public web app endpoints (GET requests only)
        public_read_paths = [
            '/api/events',
            '/api/announcements', 
            '/api/officers',
        ]
        
        # Skip auth for ALL officers-hub endpoints (Clerk handles auth at frontend)
        officers_hub_paths = [
            '/api/announcements',
            '/api/events', 
            '/api/officers',
        ]
        
        # Check request type
        is_public_read = any(request.path.startswith(path) for path in public_read_paths)
        is_officers_hub = any(request.path.startswith(path) for path in officers_hub_paths)
        is_rsvp = '/rsvp' in request.path
        is_get_request = request.method == 'GET'
        
        # Allow access for:
        # 1. GET requests to public endpoints (web app)
        # 2. All RSVP operations (public)
        # 3. ALL officers-hub operations (frontend Clerk auth handles access)
        if (is_public_read and is_get_request) or is_rsvp or is_officers_hub:
            request.user = None
            return self.get_response(request)

        # For any other endpoints, require authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authorization header required'}, status=401)

        token = auth_header.split(' ')[1]
        
        try:
            # Verify token with Clerk
            user_data = self._verify_clerk_token(token)
            if not user_data:
                return JsonResponse({'error': 'Invalid token'}, status=401)
            
            clerk_user_id = user_data.get('user_id')
            email = user_data.get('email')
            first_name = user_data.get('first_name', '')
            last_name = user_data.get('last_name', '')
            full_name = user_data.get('full_name') or f"{first_name} {last_name}".strip()
            
            # Get or create user
            user, created = User.objects.get_or_create(
                clerk_user_id=clerk_user_id,
                defaults={
                    'email': email or '',
                    'full_name': full_name or email or 'Unknown User',
                    'role': 'Officer',
                    'is_officer': True,
                }
            )
            
            # Block access if not an officer
            if not user.is_officer:
                return JsonResponse({'error': 'Access denied - officers only'}, status=403)
            
            # Attach user to request
            request.user = user
            
        except Exception as e:
            return JsonResponse({'error': 'Authentication failed'}, status=401)

        return self.get_response(request)

    def _verify_clerk_token(self, token):
        """
        Verify JWT token with Clerk's API.
        Returns user data if valid, None if invalid.
        """
        try:
            # Use Clerk's session verification endpoint
            url = f"https://api.clerk.dev/v1/sessions/verify"
            headers = {
                'Authorization': f'Bearer {settings.CLERK_SECRET_KEY}',
                'Content-Type': 'application/json',
            }
            
            # Send token for verification
            response = requests.post(url, headers=headers, json={'token': token}, timeout=10)
            
            if response.status_code == 200:
                session_data = response.json()
                user_id = session_data.get('user_id')
                
                if user_id:
                    # Get user details from Clerk
                    user_url = f"https://api.clerk.dev/v1/users/{user_id}"
                    user_response = requests.get(user_url, headers=headers, timeout=10)
                    
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        return {
                            'user_id': user_id,
                            'email': user_data.get('email_addresses', [{}])[0].get('email_address'),
                            'first_name': user_data.get('first_name'),
                            'last_name': user_data.get('last_name'),
                            'full_name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
                        }
            
            return None
            
        except Exception as e:
            print(f"Clerk token verification failed: {e}")
            return None 