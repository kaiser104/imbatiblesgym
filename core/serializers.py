# core/serializers.py
from rest_framework import serializers
from .models import Gym, Trainer, Trainee

class GymSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gym
        fields = ['id', 'name', 'address', 'phone']

class TrainerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trainer
        fields = ['id', 'gym', 'name', 'specialty', 'email']

class TraineeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trainee
        fields = ['id', 'gym', 'trainer', 'name', 'email', 'join_date']
