# core/serializers.py
from rest_framework import serializers
from .models import Gym

# Se crea el serializador para el modelo Gym
class GymSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gym
        fields = ['id', 'name', 'address', 'phone']  # Se incluyen los campos id, name, address y phone
