from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User

class RegisterViewTests(APITestCase):
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    RESET = "\033[0m"
    SEP = f"{YELLOW}{'='*60}{RESET}"

    def setUp(self):
        self.url = reverse('register')
        self.valid_payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPass123!',
            'confirmPassword': 'StrongPass123!'
        }

    def print_section(self, label, response):
        print(f"\n{self.SEP}")
        print(f"{self.CYAN}{label}{self.RESET}")
        print(f"{self.GREEN}Response data:{self.RESET} {response.data}")
        print(f"{self.GREEN}Response cookies:{self.RESET} {response.cookies}")
        print(self.SEP)

    def test_register_success(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.print_section("test_register_success", response)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertEqual(User.objects.get(username='newuser').email, 'newuser@example.com')

    def test_register_password_mismatch(self):
        payload = self.valid_payload.copy()
        payload['confirmPassword'] = 'WrongPass123!'
        response = self.client.post(self.url, payload, format='json')
        self.print_section("test_register_password_mismatch", response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_missing_fields(self):
        payload = self.valid_payload.copy()
        del payload['email']
        response = self.client.post(self.url, payload, format='json')
        self.print_section("test_register_missing_fields", response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_duplicate_username(self):
        User.objects.create_user(username='newuser', email='other@example.com', password='StrongPass123!')
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.print_section("test_register_duplicate_username", response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_duplicate_email(self):
        User.objects.create_user(username='otheruser', email='newuser@example.com', password='StrongPass123!')
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.print_section("test_register_duplicate_email", response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
