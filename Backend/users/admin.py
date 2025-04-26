from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from django.contrib.auth.models import Group

# Unregister unwanted models from the admin
for model in [Group]:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'id', 'is_two_factor_enabled', 'is_oauth_user')
    ordering = ('date_joined',)
    
    fieldsets = (
        ('User Credentials', {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'intra_id', 'intra_login', 'profile_image', 'is_two_factor_enabled', 'is_oauth_user')}),
        ('game info', {'fields': ('wins', 'losses', 'total_games', 'rank')})
    )