from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .authentication import JWTCookieAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, BlacklistMixin
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from django.contrib.auth import authenticate
from .serializers import UserSerializer, RegisterSerializer
from .models import User, RevokedAccessToken
import requests
import os
import secrets
import string
import pyotp
import base64
import qrcode
import io
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.shortcuts import get_object_or_404, redirect
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from tournaments.block import get_tournaments

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class LoginView(APIView):
    """
    View for user login
    post request with username and password
    returns access and refresh tokens
    cookies are set with HttpOnly and Secure flags
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').lower()
        password = request.data.get('password', '')

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        user.update_stats()
        refresh = RefreshToken.for_user(user)
        access_token_str = str(refresh.access_token)
        refresh_token_str = str(refresh)
        response = Response({
            'user': UserSerializer(user).data,
            'success': True
        })
        response.data['user']['tournaments'] = get_tournaments(user.username)
        print(response.data)
        response.set_cookie(key='access_token', value=access_token_str, httponly=True, secure=True, samesite='Lax', max_age=60 * 30)
        response.set_cookie(key='refresh_token', value=refresh_token_str, httponly=True, secure=True, samesite='Lax', max_age=60 * 60 * 24)
        return response

class Setup2FAView(APIView):
    """
    View for setting up 2FA
    post request with user credentials
    delete any existing TOTP devices for this user
    create a new TOTP device
    generate the TOTP secret key
    create the OTP provisioning URI
    generate a QR code for the URI
    return secret key and QR code
    """
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        TOTPDevice.objects.filter(user=user).delete() #delete any existing TOTP devices for this user
        device = TOTPDevice.objects.create(
            user=user,
            name=f"2FA Device for {user.username}",
            confirmed=False
        ) # create a new TOTP device
        secret_key = base64.b32encode(device.bin_key).decode('utf-8') # Generate the TOTP secret key
        totp = pyotp.TOTP(secret_key) # Create the OTP provisioning URI
        provisioning_uri = totp.provisioning_uri(user.email, issuer_name="ft_transcendence")
        qr = qrcode.make(provisioning_uri) # Generate a QR code for the URI
        qr_buffer = io.BytesIO()
        qr.save(qr_buffer, format="PNG")
        qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode('utf-8')
        return Response({
            'secret_key': secret_key,
            'qr_code': f"data:image/png;base64,{qr_base64}"
        })

class Verify2FAView(APIView):
    """
    View for verifying 2FA
    post request with otp_token
    verify the token
    if valid, mark the device as confirmed and enable 2FA for the user
    returns success message
    """
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        otp_token = request.data.get('otp_token')
        if not otp_token:
            return Response({'error': 'OTP token required'}, status=status.HTTP_400_BAD_REQUEST)
        devices = TOTPDevice.objects.filter(user=user)
        if not devices.exists():
            return Response({'error': 'No 2FA device found. Please set up 2FA first.'}, status=status.HTTP_400_BAD_REQUEST)
        device = devices.first()
        if device.verify_token(otp_token):
            device.confirmed = True
            device.save()
            user.is_two_factor_enabled = True
            user.save()
            return Response({
                'success': True,
                'message': '2FA has been enabled successfully',
                'user': UserSerializer(user).data
            })
        else:
            return Response({
                'success': False,
                'error': 'Invalid OTP token'
            }, status=status.HTTP_400_BAD_REQUEST)

class Disable2FAView(APIView):
    """
    View for disabling 2FA
    post request with otp_token
    verify the token
    if valid, disable 2FA for the user
    returns success message
    """
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        otp_token = request.data.get('otp_token')
        if not user.is_two_factor_enabled:
            return Response({'error': '2FA is not enabled for this user'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp_token:
            return Response({'error': 'OTP token required'}, status=status.HTTP_400_BAD_REQUEST)
        devices = TOTPDevice.objects.filter(user=user)
        if not devices.exists():
            return Response({'error': 'No 2FA device found'}, status=status.HTTP_400_BAD_REQUEST)
        device = devices.first()
        if device.verify_token(otp_token):
            user.is_two_factor_enabled = False
            user.save()
            device.delete()
            return Response({
                'success': True,
                'message': '2FA has been disabled successfully',
                'user': UserSerializer(user).data
            })
        else:
            return Response({
                'success': False,
                'error': 'Invalid OTP token'
            }, status=status.HTTP_400_BAD_REQUEST)
        

class UserDetailView(generics.RetrieveAPIView):
    """
    View for user details
    get request with user credentials
    returns user details
    """
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get(self, request):
        user = self.request.user
        response = Response({
            'user': UserSerializer(user).data,
            'status': 'success',
            'success': True
        })
        response.data['user']['tournaments'] = get_tournaments(user.username)
        return response

class FortyTwoLoginView(APIView):
    """
    View for 42 login
    get request with user credentials
    redirect to 42's OAuth authorization page with client_id, redirect_uri, response_type, state, scope
    returns access and refresh tokens
    cookies are set with HttpOnly and Secure flags
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        client_id = os.environ.get('FT_CLIENT_ID')
        redirect_uri = os.environ.get('FT_REDIRECT_URI')
        state = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        request.session['oauth_state'] = state
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
    View for 42 callback
    get request with code and state
    exchange code with 42 for access and refresh tokens
    set cookies with HttpOnly and Secure flags
    returns access and refresh tokens
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        stored_state = request.session.get('oauth_state')
        if not stored_state or state != stored_state: # Check if the state matches
            return Response({"error": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST)
        request.session.pop('oauth_state', None) # Clear the state from the session
        client_id = os.environ.get('FT_CLIENT_ID')
        client_secret = os.environ.get('FT_CLIENT_SECRET')
        redirect_uri = os.environ.get('FT_REDIRECT_URI')
        token_url = "https://api.intra.42.fr/oauth/token" # Exchange the code for an access token
        token_data = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }
        try:
            token_response = requests.post(token_url, data=token_data) # Exchange the code for an access token
            token_response.raise_for_status() # Raise an exception if the request fails
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            profile_url = "https://api.intra.42.fr/v2/me" # Get the user's 42 profile
            headers = {"Authorization": f"Bearer {access_token}"} # Use the access token to get the user's 42 profile
            profile_response = requests.get(profile_url, headers=headers) # Get the user's 42 profile
            profile_response.raise_for_status() # Raise an exception if the request fails
            profile_data = profile_response.json() # Get the user's 42 profile
            intra_id = str(profile_data.get('id'))
            intra_login = profile_data.get('login')
            email = profile_data.get('email')
            try:
                user = User.objects.get(intra_id=intra_id) # Try to find an existing user with this intra_id
            except User.DoesNotExist:
                username = intra_login # Create a new user if none exists
                password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16)) # Generate a random password
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    intra_id=intra_id,
                    intra_login=intra_login,
                    is_oauth_user=True,
                    profile_image=profile_data.get('image', {}).get('link', '')
                )
            refresh = RefreshToken.for_user(user) # Generate JWT tokens for the user
            access_token = str(refresh.access_token) # from refresh token we get access token
            refresh_token = str(refresh) # from refresh token we get refresh token
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') # Get the frontend URL from environment
            redirect_url = f"{frontend_url}/oauth/callback.html?access_token={access_token}&refresh_token={refresh_token}"
            user.update_stats()
            return redirect(redirect_url)
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            

class LogoutView(APIView):
    """
    View for logout
    post request with user credentials
    returns success message
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response({'success': True, 'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        access_token_string = request.COOKIES.get('access_token')
        refresh_token_string = request.COOKIES.get('refresh_token')
        if access_token_string:
            try:
                RevokedAccessToken.objects.get_or_create(
                    token=access_token_string,
                    user=request.user
                ) # Store the access token in the blacklist
            except Exception:
                pass
        if refresh_token_string:
            try:
                token = RefreshToken(refresh_token_string)
                token.blacklist()
            except TokenError:
                pass
            except Exception:
                pass

        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class CookieTokenRefreshView(APIView):
    """
    View for token refresh
    post request with refresh token
    returns new access and refresh tokens
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({"error": "No refresh token found in cookies"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            refresh = RefreshToken(refresh_token)
            response = Response({
                'success': True,
                'message': 'Token refreshed successfully'
            })
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite='Lax',
                max_age=60 * 30  # 30 minutes in seconds
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite='Lax',
                max_age=60 * 60 * 24  # 1 day in seconds
            )
            return response
        except (InvalidToken, TokenError) as e:
            pass