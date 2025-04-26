from rest_framework import generics
from rest_framework import permissions
from rest_framework.response import Response
from .models import Tournament, Match
from .serializers import TournamentSerializer, MatchSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from .permissions import IsOwnerOrReadOnly
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404

# Create your views here.
class TournamentListCreateView(generics.ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TournamentSerializer
    queryset = Tournament.objects.all()
    
    def post(self, request, *args, **kwargs):
        name = request.data.get('name')
        if Tournament.objects.filter(name=name).exists():
            return Response({"detail": "A tournament with that name already exists"}, status=status.HTTP_400_BAD_REQUEST)
        return super().post(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    


class TournamentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsOwnerOrReadOnly] #only creator can modify or delete a tournament 
    authentication_classes = [JWTAuthentication]
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    
    def get_object(self):
        return self.request.user

    
class TournamentJoinView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    #pk is the primary key of the tournament (id)
    def post(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        user = request.user

        # Basic check: Prevent creator from joining their own tournament? (Optional)
        # if tournament.created_by == user:
        #     return Response({"detail": "Creator cannot join as participant."}, status=status.HTTP_400_BAD_REQUEST)

        if user in tournament.participants.all():
            return Response({"detail": "You have already joined this tournament."}, status=status.HTTP_400_BAD_REQUEST)

        # Add more checks here later if needed (e.g., tournament status is 'Open', participant limit)

        tournament.participants.add(user)
        return Response({"detail": "Successfully joined the tournament."}, status=status.HTTP_200_OK)

class TournamentLeaveView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated] 

    def post(self, request, pk): # Using POST for simplicity, could use DELETE
        tournament = get_object_or_404(Tournament, pk=pk)
        user = request.user

        if user not in tournament.participants.all():
            return Response({"detail": "You are not a participant in this tournament."}, status=status.HTTP_400_BAD_REQUEST)

        # Add more checks here later if needed (e.g., tournament status)

        tournament.participants.remove(user)
        return Response({"detail": "Successfully left the tournament."}, status=status.HTTP_200_OK)

class MatchListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = MatchSerializer
    
    def get_object(self):
        tournament_pk = self.kwargs.get('tournament_pk')
        return get_object_or_404(Match, tournament__pk=tournament_pk)

    def perform_create(self, serializer):
        tournament_pk = self.kwargs.get('tournament_pk')
        tournament = get_object_or_404(Tournament, pk=tournament_pk)
        serializer.save(tournament=tournament)

class MatchRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsOwnerOrReadOnly]
    authentication_classes = [JWTAuthentication]
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    
    def get_queryset(self):
        tournament_pk = self.kwargs.get('tournament_pk')
        return Match.objects.filter(tournament__pk=tournament_pk)