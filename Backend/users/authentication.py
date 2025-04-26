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
        
        if raw_token is None:
            # If no token in cookies, fall back to the standard header authentication
            return super().authenticate(request)
        
        # --- Check Revocation List FIRST ---
        # Check if the exact raw token string exists in our custom revocation list.
        # Do this *before* validating to potentially save processing time.
        if RevokedAccessToken.objects.filter(token=raw_token).exists():
            # Token string found in the revocation list - authentication fails
            return None
        # --- End Revocation Check ---

        # If not revoked, proceed with standard validation (signature, expiry)
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            # If standard validation fails, authentication fails
            return None 

        # Token is valid (signature, expiry) AND not found in our revocation list
        return self.get_user(validated_token), validated_token