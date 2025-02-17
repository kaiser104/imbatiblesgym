from django.http import JsonResponse
from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser  # Asegúrate de que `CustomUser` está importado correctamente
from .serializers import UserSerializer

# 📌 Vista básica para verificar que el backend funciona
def home(request):
    return JsonResponse({"message": "¡Bienvenido a la API de Imbatibles Gym!"})

# 📌 Vista para el registro de usuarios
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# 📌 Vista para el login de usuarios
class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user:
            login(request, user)
            return Response({"message": "Inicio de sesión exitoso"}, status=status.HTTP_200_OK)
        return Response({"error": "Credenciales incorrectas"}, status=status.HTTP_400_BAD_REQUEST)
