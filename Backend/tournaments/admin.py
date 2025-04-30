from django.contrib import admin
from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('player1Name', 'player2Name', 'player1Score', 'player2Score', 'matchType', 'winner', 'created_at', 'updated_at')
    search_fields = ('player1Name', 'player2Name')
    list_filter = ('matchType', 'winner')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'