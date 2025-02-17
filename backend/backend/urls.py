from django.contrib import admin
from django.urls import path, include
from api.views import home  # Importamos la vista home

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', home),  # Ahora la raíz del backend mostrará un mensaje de bienvenida
]
