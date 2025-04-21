from rest_framework import serializers
from .models import User, PlayerProfile
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import password_validation

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_image', 'intra_id', 'intra_login', 'is_oauth_user', 'is_two_factor_enabled']
        read_only_fields = ['id', 'intra_id', 'intra_login', 'is_oauth_user']
    
    def update(self, instance, validated_data):
        # Check if trying to update oauth user
        if instance.is_oauth_user and 'username' in validated_data:
            raise serializers.ValidationError({"username": "Cannot change username for OAuth users"})
            
        return super().update(instance, validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileUpdateSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    
    # Password change fields (all optional)
    current_password = serializers.CharField(required=False, write_only=True)
    new_password = serializers.CharField(required=False, write_only=True)
    confirm_password = serializers.CharField(required=False, write_only=True)
    
    # Profile image 
    avatar = serializers.ImageField(required=False)
    
    def validate(self, attrs):
        # Password validation
        if 'new_password' in attrs or 'current_password' in attrs:
            # Check if all required password fields are present
            required_fields = ['new_password', 'confirm_password']
            if not all(field in attrs for field in required_fields):
                raise serializers.ValidationError({
                    "password": "All password fields are required for password change."
                })
            
            # Check if passwords match
            if attrs['new_password'] != attrs['confirm_password']:
                raise serializers.ValidationError({"password": "Password fields didn't match."})
            
            # Validate current password
            user = self.context['request'].user
            if not user.check_password(attrs['current_password']):
                raise serializers.ValidationError({"current_password": "Current password is not correct"})
            
            # Validate new password
            validate_password(attrs['new_password'])
            
        # Username validation
        if 'username' in attrs:
            new_username = attrs['username']
            user = self.context['request'].user
            
            # Check if username is the same as current
            if new_username == user.username:
                pass  # No change needed
            # Check if username already exists
            elif User.objects.filter(username=new_username).exclude(id=user.id).exists():
                raise serializers.ValidationError({"username": "Username already exists"})
        
        return attrs
    
    def update(self, instance, validated_data):
        password_updated = False
        
        # Handle password update
        if 'new_password' in validated_data:
            instance.set_password(validated_data['new_password'])
            password_updated = True
        
        # Handle username and email updates
        if 'username' in validated_data and not instance.is_oauth_user:
            instance.username = validated_data['username']
        
        if 'email' in validated_data:
            instance.email = validated_data['email']
            
        instance.save()
        
        # Handle avatar update
        if 'avatar' in validated_data and hasattr(instance, 'profile'):
            if instance.profile.avatar:
                instance.profile.avatar.delete()
            instance.profile.avatar = validated_data['avatar']
            instance.profile.save()
        
        # Return info if password was updated (for token refresh)
        return instance, password_updated

class PlayerProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    win_rate = serializers.ReadOnlyField()
    avatar = serializers.ImageField()
    
    class Meta:
        model = PlayerProfile
        fields = ['id', 'username', 'total_games', 'wins', 'losses', 'rank', 'win_rate', 'avatar']
        read_only_fields = ['id', 'win_rate']