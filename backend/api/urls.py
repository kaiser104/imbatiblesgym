from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, ProfileView, ExerciseListView,
    UploadExerciseView, UpdateExerciseView, home, CustomUserLoginView
)

urlpatterns = [
    path('', home, name='home'),  # Endpoint de prueba
    path('register/', RegisterView.as_view(), name='register'),  # Registro de usuario
    path('login/', CustomUserLoginView.as_view(), name='login'),  # Login basado en JWT
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Para refrescar el token
    path('profile/', ProfileView.as_view(), name='profile'),  # Perfil de usuario
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),  # Listado de ejercicios
    path('upload-exercise/', UploadExerciseView.as_view(), name='upload-exercise'),  # Subir ejercicios
    path('update-exercise/<int:pk>/', UpdateExerciseView.as_view(), name='update-exercise'),  # Editar ejercicios
]
