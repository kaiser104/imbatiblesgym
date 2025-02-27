# core/views.py
from rest_framework import viewsets
from .models import Gym, Trainer, Trainee
from .serializers import GymSerializer, TrainerSerializer, TraineeSerializer

class GymViewSet(viewsets.ModelViewSet):
    queryset = Gym.objects.all()
    serializer_class = GymSerializer

class TrainerViewSet(viewsets.ModelViewSet):
    queryset = Trainer.objects.all()
    serializer_class = TrainerSerializer

class TraineeViewSet(viewsets.ModelViewSet):
    queryset = Trainee.objects.all()
    serializer_class = TraineeSerializer
