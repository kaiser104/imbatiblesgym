from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import CustomUser, Exercise
from .serializers import UserSerializer, ExerciseSerializer

# Registro de Usuarios
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

# Login de Usuarios con JWT
class CustomUserLoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            response.data['message'] = 'Login successful'
        return response

# Perfil de Usuario (Protegido con JWT)
class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_object(self):
        return self.request.user

# Listar Ejercicios
class ExerciseListView(generics.ListAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.AllowAny]

# Subir Ejercicio (Aceptar cualquier tipo de archivo)
class UploadExerciseView(generics.CreateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No se adjuntó ningún archivo"}, status=400)

        exercise = Exercise.objects.create(
            name=request.data.get("name"),
            category=request.data.get("category"),
            equipment=request.data.get("equipment"),
            primary_muscle=request.data.get("primary_muscle"),
            secondary_muscle=request.data.get("secondary_muscle"),
            file=file  # Guardar el archivo tal como llega
        )
        return Response(ExerciseSerializer(exercise).data, status=201)

# Editar Ejercicio
class UpdateExerciseView(generics.UpdateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

# Endpoint de prueba (para verificar que el servidor está corriendo)
def home(request):
    return JsonResponse({"message": "Bienvenido a la API de Imbatibles Gym"})
