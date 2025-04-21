from rest_framework import serializers
from .models import User, PlayerProfile
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_image', 'intra_id', 'intra_login', 'is_oauth_user', 'is_two_factor_enabled']
        read_only_fields = ['id', 'intra_id', 'intra_login', 'is_oauth_user']

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

class PlayerProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    win_rate = serializers.ReadOnlyField()
    avatar = serializers.ImageField()
    
    class Meta:
        model = PlayerProfile
        fields = ['id', 'username', 'total_games', 'wins', 'losses', 'rank', 'win_rate', 'avatar']
        read_only_fields = ['id', 'win_rate']