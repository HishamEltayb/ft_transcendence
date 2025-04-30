from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from .models import RevokedAccessToken # Import our custom model
from rest_framework_simplejwt.exceptions import InvalidToken # Import InvalidToken for exception handling

class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT authentication class that extracts tokens from cookies if they exist,
    falling back to the standard Authorization header if not.
    Checks custom RevokedAccessToken list.
    """
    
    def authenticate(self, request):
        # First, try to get the token from the cookie
        raw_token = request.COOKIES.get('access_token')
        
        # If no token in cookies, try to get from Authorization header
        if raw_token is None:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ', 1)[1].strip()
            else:
                return super().authenticate(request)

        
        # Print all revoked tokens for comparison
        revoked_tokens = list(RevokedAccessToken.objects.values_list('token', flat=True))

        # --- Check Revocation List FIRST ---
        if RevokedAccessToken.objects.filter(token=raw_token).exists():
            return None
        # --- End Revocation Check ---

        # If not revoked, proceed with standard validation (signature, expiry)
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None 

        # Token is valid (signature, expiry) AND not found in our revocation list
        return self.get_user(validated_token), validated_token