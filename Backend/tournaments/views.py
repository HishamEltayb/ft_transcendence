from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework          import status
from .models                 import Tournament, Match
from users.authentication import JWTCookieAuthentication
from rest_framework import permissions
from .block import save_tournament, get_tournaments
# from ...Blockchain.views import get_blockchain
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
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]

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
      print("data", request)
      # 1. if it's a QueryDict, rebuild a proper list of dicts
      if isinstance(data, QueryDict):
          matches = []
          i = 0
          while True:
              prefix = f"matches[{i}]"
              if f"{prefix}[player1Name]" not in data:
                  break
              matches.append({
                  "Player1Name":  data.get(f"{prefix}[player1Name]"),
                  "Player2Name":  data.get(f"{prefix}[player2Name]"),
                  "Player1Score": int(data.get(f"{prefix}[player1Score]", 0)),
                  "Player2Score": int(data.get(f"{prefix}[player2Score]", 0)),
                  "Winner":        data.get(f"{prefix}[winner]"),
              })
              i += 1
      else:
        matches = [
            {
                "Player1Name": match.get("player1Name"),  # Correct the case here
                "Player2Name": match.get("player2Name"),  # Correct the case here
                "Player1Score": match.get("player1Score"),
                "Player2Score": match.get("player2Score"),
                "Winner": match.get("winner")  # Ensure this matches exactly
            }
            for match in data
        ]
      print("username", request.user.username)
      id = save_tournament(tournament_name=request.user.username, matches=matches)
    #   tour = get_tournaments(request.user.username)
    #   print("tournement", tour)
      return Response(
          {
              'tournament_id': id
          },
          status=status.HTTP_201_CREATED
      )


class TournamentListView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tournaments = get_tournaments(request.user.username)
        return Response(tournaments, status=status.HTTP_200_OK)