from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserSerializer, RegisterSerializer
from .models import User
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


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').lower()
        password = request.data.get('password', '')
        otp_token = request.data.get('otp_token', None)

        user = authenticate(username=username, password=password)

        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Check if 2FA is enabled for this user
        if user.is_two_factor_enabled:
            # If no OTP token was provided, tell the client to request one
            if not otp_token:
                return Response({
                    'require_2fa': True,
                    'user_id': user.id,
                    'message': 'Please provide an OTP token'}, 
                    status=status.HTTP_200_OK)
            
            # Verify the provided OTP token
            devices = TOTPDevice.objects.filter(user=user)
            if not devices.exists():
                return Response({'error': 'No 2FA device found for this user'}, status=status.HTTP_400_BAD_REQUEST)
            
            device = devices.first()
            if not device.verify_token(otp_token):
                return Response({'error': 'Invalid OTP token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # At this point, the user is authenticated (and passed 2FA if enabled)
        refresh = RefreshToken.for_user(user)
        
        # Create response with user data
        response = Response({
            'user': UserSerializer(user).data,
            'success': True
        })
        
        # Set JWT cookies as HttpOnly and Secure
        # Access token (shorter expiration)
        response.set_cookie(
            key='access_token',
            value=str(refresh.access_token),
            httponly=True,
            secure=True,  # Use True in production with HTTPS
            samesite='Lax',
            max_age=60 * 30  # 30 minutes in seconds
        )
        
        # Refresh token (longer expiration)
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            httponly=True,
            secure=True,  # Use True in production with HTTPS
            samesite='Lax',
            max_age=60 * 60 * 24  # 1 day in seconds
        )
        
        return response

class Setup2FAView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Delete any existing TOTP devices for this user
        TOTPDevice.objects.filter(user=user).delete()
        
        # Create a new TOTP device
        device = TOTPDevice.objects.create(
            user=user,
            name=f"2FA Device for {user.username}",
            confirmed=False
        )
        
        # Generate the TOTP secret key
        secret_key = base64.b32encode(device.bin_key).decode('utf-8')
        
        # Create the OTP provisioning URI
        totp = pyotp.TOTP(secret_key)
        provisioning_uri = totp.provisioning_uri(user.email, issuer_name="ft_transcendence")
        
        # Generate a QR code for the URI
        qr = qrcode.make(provisioning_uri)
        qr_buffer = io.BytesIO()
        qr.save(qr_buffer, format="PNG")
        qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode('utf-8')
        
        return Response({
            'secret_key': secret_key,
            'qr_code': f"data:image/png;base64,{qr_base64}"
        })

class Verify2FAView(APIView):
    authentication_classes = [JWTAuthentication]
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
            # Mark device as confirmed and enable 2FA for the user
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
    authentication_classes = [JWTAuthentication]
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
            # Disable 2FA and remove device
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
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    queryset = User.objects.all()
    serializer_class = UserSerializer
    
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
                username = intra_login
                
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
            
            # Generate JWT tokens for the user
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
        
            # Create the redirect URL with the tokens
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
            redirect_url = f"{frontend_url}/oauth/callback.html?access_token={access_token}&refresh_token={refresh_token}"
            
            return redirect(redirect_url)
            
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            


class PlayerProfileUpdateView(generics.UpdateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        game_result = request.data.get('game_result')
        if game_result:
            user.total_games += 1
            if game_result.lower() == 'win':
                user.wins += 1
                user.rank += 10
            elif game_result.lower() == 'loss':
                user.losses += 1
                # Decrement rank for losing, but not below 0
                user.rank = max(0, user.rank - 5)
            user.save()
            return Response(self.get_serializer(user).data)
        
        # Handle direct stats update (admin or system use)
        return super().update(request, *args, **kwargs)
        
class LeaderboardView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-rank')[:10]  # Top 10 players by rank


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        response = Response({'success': True, 'message': 'Logged out successfully'})
        
        # Clear JWT cookies
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        return response

