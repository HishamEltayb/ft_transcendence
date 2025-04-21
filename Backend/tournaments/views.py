from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from .models import Tournament
from .serializers import TournamentSerializer

# Create your views here.
class TournamentListCreateView(generics.ListCreateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    