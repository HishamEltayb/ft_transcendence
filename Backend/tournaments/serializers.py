from rest_framework import serializers
from .models import Tournament, Match


class TournamentSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'created_at', 'updated_at', 'created_by', 'participants', 'created_by_username']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'participants', 'created_by_username']

    def validate(self, attrs):
        if 'start_date' in attrs and 'end_date' in attrs and attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError({"dates": "Start date must be before end date."})
        return attrs

class MatchSerializer(serializers.ModelSerializer):
    player1_username = serializers.CharField(source='player1.username', read_only=True)
    player2_username = serializers.CharField(source='player2.username', read_only=True)
    winner_username = serializers.CharField(source='winner.username', read_only=True)
    class Meta:
        model = Match
        fields = [
            'id',
            'tournament',
            'player1',
            'player2',
            'player1_score',
            'player2_score',
            'winner',
            'match_status',
            'created_at',
            'updated_at',
            'player1_username',
            'player2_username',
            'winner_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'player1_username', 'player2_username', 'winner_username', 'tournament']