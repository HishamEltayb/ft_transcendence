from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User

class LoginViewTests(APITestCase):
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    RESET = "\033[0m"
    SEP = f"{YELLOW}{'='*60}{RESET}"

    def setUp(self):
        self.url = reverse('login')
        self.username = 'testuser'
        self.email = 'testuser@example.com'
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(username=self.username, email=self.email, password=self.password)

    def print_section(self, label, response):
        print(f"\n{self.SEP}")
        print(f"{self.CYAN}{label}{self.RESET}")
        print(f"{self.GREEN}Response data:{self.RESET} {response.data}")
        print(f"{self.GREEN}Response cookies:{self.RESET} {response.cookies}")
        print(self.SEP)

    def test_login_success(self):
        response = self.client.post(self.url, {'username': self.username, 'password': self.password}, format='json')
        self.print_section("test_login_success", response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)

    def test_login_invalid_username(self):
        response = self.client.post(self.url, {'username': 'wronguser', 'password': self.password}, format='json')
        self.print_section("test_login_invalid_username", response)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_invalid_password(self):
        response = self.client.post(self.url, {'username': self.username, 'password': 'WrongPass!'}, format='json')
        self.print_section("test_login_invalid_password", response)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_missing_fields(self):
        response = self.client.post(self.url, {'username': self.username}, format='json')
        self.print_section("test_login_missing_fields", response)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_with_2fa(self):
        import os
        import binascii
        import base64
        import time as pytime
        from django_otp.plugins.otp_totp.models import TOTPDevice
        import pyotp

        # Enable 2FA for the user and create a confirmed TOTP device
        self.user.is_two_factor_enabled = True
        self.user.save()
        import time
        # Clean up any existing devices
        TOTPDevice.objects.filter(user=self.user).delete()
        # Generate a 20-byte random hex key
        hex_key = os.urandom(20).hex()
        device = TOTPDevice.objects.create(
            user=self.user,
            confirmed=True,
            key=hex_key,
            name=f"2FA Device for {self.username}"
        )
        device.save()
        device.refresh_from_db()
        # Print all devices for the user after creation
        devices = TOTPDevice.objects.filter(user=self.user)
        print("TEST DEBUG: Devices after creation:", list(devices.values()))
        base32_secret = base64.b32encode(device.bin_key).decode()
        totp = pyotp.TOTP(base32_secret)
        pytime.sleep(1)  # Ensure DB commit is visible
        device.tolerance = 3
        device.save()
        now = pytime.time()
        possible_otps = [
            (now - 30, totp.at(now - 30)),
            (now, totp.at(now)),
            (now + 30, totp.at(now + 30)),
        ]
        print("DEBUG: Trying possible OTPs:")
        for t, otp in possible_otps:
            print(f"  OTP for time {int(t)}: {otp}")

        # 1. Login without OTP token (should require 2FA)
        response = self.client.post(self.url, {'username': self.username.lower(), 'password': self.password}, format='json')
        self.print_section("test_login_2fa_required_no_otp", response)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get('require_2fa'))

        # 2. Login with invalid OTP token
        response = self.client.post(self.url, {'username': self.username.lower(), 'password': self.password, 'otp_token': '000000'}, format='json')
        self.print_section("test_login_2fa_invalid_otp", response)
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.data)

        # 3. Try valid OTPs for previous, current, next time step
        success = False
        for t, otp in possible_otps:
            print(f"DEBUG: Trying OTP {otp} for time {int(t)}")
            response = self.client.post(self.url, {'username': self.username.lower(), 'password': self.password, 'otp_token': otp}, format='json')
            self.print_section(f"test_login_2fa_valid_otp_attempt_{otp}", response)
            if response.status_code == 200:
                success = True
                break
        self.assertTrue(success, "No OTP was accepted by the backend")
