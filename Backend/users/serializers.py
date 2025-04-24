from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    win_rate = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_image', 'intra_id', 'intra_login', 'is_oauth_user', 'is_two_factor_enabled', 'total_games', 'wins', 'losses', 'rank', 'win_rate']
        read_only_fields = ['id', 'intra_id', 'intra_login', 'is_oauth_user', 'win_rate']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirmPassword = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'confirmPassword', 'email']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirmPassword']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirmPassword')
        user = User.objects.create_user(**validated_data)
        return user
