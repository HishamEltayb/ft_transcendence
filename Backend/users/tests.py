from django.test import TestCase

# Create your tests here.
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User  # Import your custom User model


class AuthViewsTests(APITestCase):

    def setUp(self):
        self.username = 'testuser'
        self.email = 'test@example.com'
        self.password = 'testpassword123'
        self.data = {
            'username': self.username,
            'password': self.password
        }

    def test_jwt_authentication(self):
        # Create a test user
        user = User.objects.create_user(
            username=self.username, 
            email=self.email, 
            password=self.password
        )
        self.assertEqual(user.is_active, True, 'User should be active')

        # Get JWT tokens
        url = reverse('token_obtain_pair')
        response = self.client.post(url, self.data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        
        # Check that both tokens are in the response
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        access_token = response.data['access']

        # Test accessing protected endpoint with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(reverse('user-detail'), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        
        # Verify the response contains user data
        self.assertEqual(response.data['username'], self.username)
        self.assertEqual(response.data['email'], self.email)


class JWTAuthenticationTests(APITestCase):
    def setUp(self):
        self.username = 'testuser2'
        self.email = 'test2@example.com'
        self.password = 'testpassword123'
        self.user = User.objects.create_user(
            username=self.username, 
            email=self.email, 
            password=self.password
        )
        
    def test_obtain_token_success(self):
        """Test that valid credentials return tokens"""
        url = reverse('token_obtain_pair')
        data = {'username': self.username, 'password': self.password}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
    def test_obtain_token_failure(self):
        """Test that invalid credentials are rejected"""
        url = reverse('token_obtain_pair')
        data = {'username': self.username, 'password': 'wrongpassword'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_protected_endpoint_with_token(self):
        """Test accessing protected endpoint with valid token"""
        # Get token
        token_url = reverse('token_obtain_pair')
        data = {'username': self.username, 'password': self.password}
        token_response = self.client.post(token_url, data, format='json')
        access_token = token_response.data['access']
        
        # Use token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(reverse('user-detail'), format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.username)
        
    def test_protected_endpoint_without_token(self):
        """Test that protected endpoints reject unauthenticated requests"""
        response = self.client.get(reverse('user-detail'), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_token_refresh(self):
        """Test refreshing a token"""
        # Get tokens
        token_url = reverse('token_obtain_pair')
        data = {'username': self.username, 'password': self.password}
        token_response = self.client.post(token_url, data, format='json')
        refresh_token = token_response.data['refresh']
        
        # Refresh token
        refresh_url = reverse('token_refresh')
        refresh_data = {'refresh': refresh_token}
        response = self.client.post(refresh_url, refresh_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
