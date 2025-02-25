# myproject/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from core.views import GymViewSet

# Se crea el router y se registra el GymViewSet en la ruta 'gimnasios'
router = routers.DefaultRouter()
router.register(r'gimnasios', GymViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),  # Aquí se incluyen las URLs de la API
]
