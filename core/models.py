# core/models.py
from django.db import models

# Modelo para representar un Gimnasio
class Gym(models.Model):
    name = models.CharField(max_length=100)  # Nombre del gimnasio
    address = models.CharField(max_length=255)  # Dirección del gimnasio
    phone = models.CharField(max_length=20)  # Teléfono de contacto

    def __str__(self):
        return self.name

# Modelo para representar un Entrenador
class Trainer(models.Model):
    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, related_name="trainers")
    name = models.CharField(max_length=100)  # Nombre del entrenador
    specialty = models.CharField(max_length=100)  # Especialidad o área de entrenamiento
    email = models.EmailField()  # Correo electrónico del entrenador

    def __str__(self):
        return self.name

# Modelo para representar a una Persona que entrena
class Trainee(models.Model):
    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, related_name="trainees")
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True, related_name="trainees")
    name = models.CharField(max_length=100)  # Nombre del usuario
    email = models.EmailField()  # Correo electrónico
    join_date = models.DateField(auto_now_add=True)  # Fecha de inscripción, se asigna automáticamente

    def __str__(self):
        return self.name
