from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import Exercise
from .serializers import ExerciseSerializer

# ✅ Endpoint para actualizar un ejercicio existente
class UpdateExerciseView(generics.UpdateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def patch(self, request, *args, **kwargs):
        exercise_id = kwargs.get('pk')
        try:
            exercise = Exercise.objects.get(id=exercise_id)
        except Exercise.DoesNotExist:
            return Response({"error": "Ejercicio no encontrado"}, status=404)

        serializer = ExerciseSerializer(exercise, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)
        
from django.urls import path
from .views import ExerciseListView, UpdateExerciseView

urlpatterns = [
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('update-exercise/<int:pk>/', UpdateExerciseView.as_view(), name='update-exercise'),
]
from django.urls import path
from api.views import CustomUserLoginView  # Asegúrate de importar la vista de login

urlpatterns = [
    path('login/', CustomUserLoginView.as_view(), name='login'),
]
