from django.urls import path
from .views import RegisterView, LoginView, UserDetailView, FortyTwoLoginView, FortyTwoCallbackView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('oauth/42/', FortyTwoLoginView.as_view(), name='42-login'),
    path('oauth/42/callback/', FortyTwoCallbackView.as_view(), name='42-callback'),
]