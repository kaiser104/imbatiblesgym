from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authentication import TokenAuthentication
from django.http import JsonResponse  # Importación agregada
from .models import CustomUser
from .serializers import UserSerializer


# ✅ Vista de bienvenida a la API
def home(request):
    return JsonResponse({"message": "Bienvenido a la API de Imbatibles Gym"})


# ✅ Registro de usuario
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


# ✅ Login de usuario y generación de token
class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key})
        return Response({"error": "Credenciales incorrectas"}, status=400)


# ✅ Perfil de usuario protegido con Token
class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_object(self):
        return self.request.user
