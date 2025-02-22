from django.contrib import admin
from django.urls import path, include
from api.views import home

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Aquí se incluyen las rutas de la app API
    path('', home),  # Ruta raíz que devuelve un mensaje de bienvenida
]
