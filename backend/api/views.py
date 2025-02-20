from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse
from .models import CustomUser, Exercise
from .serializers import UserSerializer, ExerciseSerializer


# ✅ Registro de Usuarios
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


# ✅ Login de Usuarios (Devuelve Token)
class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key})
        return Response({"error": "Credenciales incorrectas"}, status=400)


# ✅ Perfil de Usuario (Protegido con Token)
class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_object(self):
        return self.request.user


# ✅ Listar Ejercicios
class ExerciseListView(generics.ListAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.AllowAny]


# ✅ Subir Ejercicio (Imagen, GIF o Video)
class UploadExerciseView(generics.CreateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [TokenAuthentication]
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
            file=file  # Guardar cualquier tipo de archivo
        )
        return Response(ExerciseSerializer(exercise).data, status=201)


# ✅ Editar Ejercicio
class UpdateExerciseView(generics.UpdateAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [TokenAuthentication]


# ✅ Endpoint de prueba (Verifica si el servidor está corriendo)
def home(request):
    return JsonResponse({"message": "Bienvenido a la API de Imbatibles Gym"})
