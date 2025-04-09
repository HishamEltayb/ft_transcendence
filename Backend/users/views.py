from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import UserSerializer, RegisterSerializer
from .models import User
import requests
import os
import secrets
import string
from django.shortcuts import redirect
from django.conf import settings

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class FortyTwoLoginView(APIView):
    """
    Redirect the user to 42's OAuth authorization page
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Get 42 OAuth credentials from environment variables
        client_id = os.environ.get('FT_CLIENT_ID')
        redirect_uri = os.environ.get('FT_REDIRECT_URI')
        
        # Generate a random state value for security
        state = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        request.session['oauth_state'] = state
        
        # Construct the authorization URL
        auth_url = (
            f"https://api.intra.42.fr/oauth/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&state={state}"
            f"&scope=public"
        )
        
        return Response({"auth_url": auth_url})

class FortyTwoCallbackView(APIView):
    """
    Handle the callback from 42's OAuth service
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        
        # Verify the state parameter matches the one we set earlier
        stored_state = request.session.get('oauth_state')
        if not stored_state or state != stored_state:
            return Response({"error": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear the state from the session
        request.session.pop('oauth_state', None)
        
        # Get 42 OAuth credentials from environment variables
        client_id = os.environ.get('FT_CLIENT_ID')
        client_secret = os.environ.get('FT_CLIENT_SECRET')
        redirect_uri = os.environ.get('FT_REDIRECT_URI')
        
        # Exchange the code for an access token
        token_url = "https://api.intra.42.fr/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }
        
        try:
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            
            # Use the access token to get the user's 42 profile
            profile_url = "https://api.intra.42.fr/v2/me"
            headers = {"Authorization": f"Bearer {access_token}"}
            
            profile_response = requests.get(profile_url, headers=headers)
            profile_response.raise_for_status()
            profile_data = profile_response.json()
            
            # Extract relevant user data
            intra_id = str(profile_data.get('id'))
            intra_login = profile_data.get('login')
            email = profile_data.get('email')
            
            # Try to find an existing user with this intra_id
            try:
                user = User.objects.get(intra_id=intra_id)
            except User.DoesNotExist:
                # Create a new user if none exists
                username = f"{intra_login}_{intra_id}"
                
                # Generate a random password
                password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
                
                # Create the user
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    intra_id=intra_id,
                    intra_login=intra_login,
                    is_oauth_user=True,
                    profile_image=profile_data.get('image', {}).get('link', '')
                )
            
            # Generate a token for the user
            token, created = Token.objects.get_or_create(user=user)
            
            # Create the redirect URL with the token
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
            redirect_url = f"{frontend_url}/oauth/callback.html?token={token.key}"
            
            return redirect(redirect_url)
            
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Authentication Flow
# The complete authentication flow in your application works like this:

# 1 User submits registration form → RegisterView creates a new user
# 2 User submits login form → LoginView verifies credentials and returns a token
# 3 Frontend stores token in localStorage
# 4 Frontend includes token in subsequent requests
# 5 UserDetailView uses token to identify user and return their data

# 42 OAuth Flow:
# 1. User clicks "Login with 42" → FortyTwoLoginView redirects to 42 OAuth page
# 2. User authorizes the app on 42 → 42 redirects back with a code
# 3. FortyTwoCallbackView exchanges the code for a token and gets user data
# 4. User is created or logged in → Token is generated
# 5. User is redirected to frontend with token