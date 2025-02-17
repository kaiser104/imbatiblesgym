from django.urls import path
from .views import home, RegisterView, LoginView

urlpatterns = [
    path('', home, name='home'),  # Ruta para 'api/' que devuelve un mensaje de bienvenida
    path('register/', RegisterView.as_view(), name='register'),  # Registro de usuarios
    path('login/', LoginView.as_view(), name='login'),  # Login de usuarios
]