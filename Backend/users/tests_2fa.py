import base64
import pyotp
from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice

User = get_user_model()

class TwoFATestCase(APITestCase):
    def setUp(self):
        self.username = 'testuser2fa'
        self.password = 'TestPass123!'
        self.email = 'testuser2fa@example.com'
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email
        )
        self.login_url = reverse('login')
        self.setup_2fa_url = reverse('2fa-setup')
        self.verify_2fa_url = reverse('2fa-verify')
        self.disable_2fa_url = reverse('2fa-disable')

    def authenticate(self):
        # Log in to get JWT cookies
        response = self.client.post(self.login_url, {'username': self.username, 'password': self.password}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.cookies)
        self.client.cookies['access_token'] = response.cookies['access_token'].value
        self.client.cookies['refresh_token'] = response.cookies['refresh_token'].value

    def test_full_2fa_flow(self):
        self.authenticate()

        # 1. Setup 2FA
        response = self.client.post(self.setup_2fa_url)
        self.assertEqual(response.status_code, 200)
        secret_key = response.data['secret_key']
        self.assertIn('qr_code', response.data)
        print(f"2FA Setup: secret_key={secret_key}")

        # 2. Generate OTPs for verification (robust to time skew)
        import time as pytime
        totp = pyotp.TOTP(secret_key)
        now = pytime.time()
        possible_otps = [
            (now - 30, totp.at(now - 30)),
            (now, totp.at(now)),
            (now + 30, totp.at(now + 30)),
        ]
        print("DEBUG: Trying possible OTPs for verification:")
        for t, otp in possible_otps:
            print(f"  OTP for time {int(t)}: {otp}")

        # 3. Verify 2FA (try all OTPs)
        success = False
        for t, otp in possible_otps:
            print(f"DEBUG: Trying OTP {otp} for time {int(t)} (verify)")
            response = self.client.post(self.verify_2fa_url, {'otp_token': otp})
            if response.status_code == 200 and response.data.get('success'):
                self.assertTrue(response.data['user']['is_two_factor_enabled'])
                print(f"2FA Verified: {response.data}")
                success = True
                break
        self.assertTrue(success, "No OTP was accepted for verification")

        # 4. Wait for a new TOTP window to avoid replay protection
        print("Waiting for next TOTP window to test disabling 2FA...")
        pytime.sleep(31)  # Wait until a new TOTP window is guaranteed
        now = pytime.time()
        possible_otps = [
            (now - 30, totp.at(now - 30)),
            (now, totp.at(now)),
            (now + 30, totp.at(now + 30)),
        ]
        print("DEBUG: Trying possible OTPs for disabling:")
        for t, otp in possible_otps:
            print(f"  OTP for time {int(t)}: {otp}")

        # 5. Disable 2FA (try all OTPs)
        success = False
        for t, otp in possible_otps:
            print(f"DEBUG: Trying OTP {otp} for time {int(t)} (disable)")
            response = self.client.post(self.disable_2fa_url, {'otp_token': otp})
            if response.status_code == 200 and response.data.get('success'):
                self.assertFalse(response.data['user']['is_two_factor_enabled'])
                print(f"2FA Disabled: {response.data}")
                success = True
                break
        self.assertTrue(success, "No OTP was accepted for disabling")
