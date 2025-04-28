from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework          import status
from .models                 import Tournament, Match
from users.authentication import JWTCookieAuthentication
from rest_framework import permissions

from django.http import QueryDict

class MatchCreateView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    """
    POST /matches/
    {
      "player1Name":  "...",
      "player2Name":  "...",
      "player1Score": 2,
      "player2Score": 1,
      "winner":        "player1"  # or "player2"
    }
    """
    def post(self, request):
        data = request.data
        m = Match.objects.create(
            player1Name  = data['player1Name'],
            player2Name  = data['player2Name'],
            player1Score = data['player1Score'],
            player2Score = data['player2Score'],
            winner        = data['winner'],
            matchType = data['matchType']
        )
        return Response({'match_id': m.id}, status=status.HTTP_201_CREATED)

 
class TournamentCreateView(APIView):
    """
    POST /tournaments/
    [
      {
        "player1Name":  "...",
        "player2Name":  "...",
        "player1Score": 2,
        "player2Score": 1,
        "winner":        "player1"
      },
      { … },  # match #2
      { … }   # match #3
    ]
    """
    def post(self, request):
      data = request.data
      # 1. if it's a QueryDict, rebuild a proper list of dicts
      if isinstance(data, QueryDict):
          matches = []
          i = 0
          while True:
              prefix = f"matches[{i}]"
              if f"{prefix}[player1Name]" not in data:
                  break
              matches.append({
                  "player1Name":  data.get(f"{prefix}[player1Name]"),
                  "player2Name":  data.get(f"{prefix}[player2Name]"),
                  "player1Score": int(data.get(f"{prefix}[player1Score]", 0)),
                  "player2Score": int(data.get(f"{prefix}[player2Score]", 0)),
                  "winner":        data.get(f"{prefix}[winner]"),
              })
              i += 1
      else:
          matches = data

      tour = Tournament.objects.create()  
      created_match_ids = []
      for m in matches:
          match = Match.objects.create(           # FK → Tournament
              player1Name  = m['player1Name'],
              player2Name  = m['player2Name'],
              player1Score = m['player1Score'],
              player2Score = m['player2Score'],
              winner        = m['winner']
          )
          created_match_ids.append(match.id)

      # 4. respond with the new tournament’s ID (and match IDs)
      print("tour.id", tour.id)
      print("created_match_ids", created_match_ids)
      return Response(
          {
              'tournament_id': tour.id,
              'match_ids': created_match_ids
          },
          status=status.HTTP_201_CREATED
      )
