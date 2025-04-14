from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, LoginView, UserDetailView, FortyTwoLoginView, FortyTwoCallbackView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    # path('login/', LoginView.as_view(), name='login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('oauth/42/', FortyTwoLoginView.as_view(), name='42-login'),
    path('oauth/42/callback/', FortyTwoCallbackView.as_view(), name='42-callback'),
]