from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, LoginView,UserDetailView,
    FortyTwoLoginView, FortyTwoCallbackView,
    Setup2FAView, Verify2FAView, Disable2FAView,
    PlayerProfileDetailView, PlayerProfileUpdateView, LeaderboardView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('oauth/42/', FortyTwoLoginView.as_view(), name='42-login'),
    path('oauth/42/callback/', FortyTwoCallbackView.as_view(), name='42-callback'),
    
    # 2FA endpoints
    path('2fa/setup/', Setup2FAView.as_view(), name='2fa-setup'),
    path('2fa/verify/', Verify2FAView.as_view(), name='2fa-verify'),
    path('2fa/disable/', Disable2FAView.as_view(), name='2fa-disable'),

    # Player Profile endpoints
    path('profile/', PlayerProfileDetailView.as_view(), name='player-profile'),
    path('profile/update/', PlayerProfileUpdateView.as_view(), name='player-profile-update'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]