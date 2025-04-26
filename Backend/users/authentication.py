from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings


class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT authentication class that extracts tokens from cookies if they exist,
    falling back to the standard Authorization header if not.
    """
    
    def authenticate(self, request):
        # First, try to get the token from the cookie
        raw_token = request.COOKIES.get('access_token')
        
        if raw_token is None:
            # If no token in cookies, fall back to the standard header authentication
            return super().authenticate(request)
        
        # Process the token found in the cookie
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token 