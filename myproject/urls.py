# myproject/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from core.views import GymViewSet, TrainerViewSet, TraineeViewSet

router = routers.DefaultRouter()
router.register(r'gimnasios', GymViewSet)
router.register(r'entrenadores', TrainerViewSet)
router.register(r'trainees', TraineeViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
