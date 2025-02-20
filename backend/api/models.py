from django.contrib.auth.models import AbstractUser
from django.db import models

# ✅ Modelo de Usuario Personalizado
class CustomUser(AbstractUser):
    full_name = models.CharField(max_length=255)
    nickname = models.CharField(max_length=100, unique=True)
    birth_date = models.DateField(null=True, blank=True)
    main_goal = models.CharField(max_length=255)  # Guardar como string separado por comas
    focus_areas = models.CharField(max_length=255)  # Guardar como string separado por comas
    training_frequency = models.IntegerField(default=3)  # Número de días por semana

    def __str__(self):
        return self.username


# ✅ Modelo de Ejercicio
class Exercise(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    equipment = models.CharField(max_length=255)
    primary_muscle = models.CharField(max_length=255)
    secondary_muscle = models.CharField(max_length=255)
    file = models.FileField(upload_to="exercises/")  # Almacena imágenes, GIF o videos

    def __str__(self):
        return self.name
