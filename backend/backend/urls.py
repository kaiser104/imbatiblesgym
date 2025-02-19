from django.contrib import admin
from django.urls import path, include
from api.views import home  # Importa correctamente la función home

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', home, name="home"),  # Agrega la ruta de inicio
]
