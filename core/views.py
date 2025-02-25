# core/views.py
from rest_framework import viewsets
from .models import Gym
from .serializers import GymSerializer

# GymViewSet: Permite realizar operaciones CRUD (crear, leer, actualizar, eliminar)
# sobre el modelo Gym mediante la API REST.
class GymViewSet(viewsets.ModelViewSet):
    queryset = Gym.objects.all()
    serializer_class = GymSerializer
