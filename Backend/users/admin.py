from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'id', 'is_two_factor_enabled', 'is_oauth_user')
    ordering = ('date_joined',)
    
    fieldsets = (
        ('User Credentials', {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'profile_image', 'is_two_factor_enabled', 'is_oauth_user', 'state')}),
        ('game info', {'fields': ('wins', 'losses', 'total_games', 'rank', 'win_rate')})
    )