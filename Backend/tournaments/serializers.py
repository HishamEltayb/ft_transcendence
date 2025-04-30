# Backend/tournaments/serializers.py
from rest_framework import serializers
from .models import Tournament, Match

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        # List all the fields from the Match model you want in the JSON output
        fields = [
            'id',
            'player1Name',
            'player2Name',
            'player1Score',
            'player2Score',
            'matchType',
            'winner',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class TournamentSerializer(serializers.ModelSerializer):
    # This tells the serializer to use MatchSerializer for the 'matches' field
    # 'many=True' means it's a list of matches
    # 'read_only=True' means we can only read this data, not write it through the Tournament endpoint
    matches = MatchSerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        # List all the fields from the Tournament model you want in the JSON output
        fields = [
            'id',
            'matches', 
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


