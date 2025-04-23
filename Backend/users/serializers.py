from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from urllib.parse import urlparse
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    win_rate = serializers.ReadOnlyField()
    profile_image = serializers.SerializerMethodField()

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

class PlayerProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    win_rate = serializers.ReadOnlyField()
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'total_games', 'wins', 'losses', 'rank', 'win_rate', 'profile_image']
        read_only_fields = ['id', 'win_rate']

    def get_profile_image(self, obj):
        if obj.profile_image:
            if hasattr(obj.profile_image, 'url'):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.profile_image.url)
                return obj.profile_image.url
            elif isinstance(obj.profile_image, str):
                parsed_url = urlparse(obj.profile_image)
                if parsed_url.scheme and parsed_url.netloc:
                    return obj.profile_image
        return None