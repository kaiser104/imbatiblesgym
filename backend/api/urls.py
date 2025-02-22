from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, CustomUserLoginView, ProfileView, ExerciseListView, UploadExerciseView, UpdateExerciseView, home

urlpatterns = [
    path('', home, name='home'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomUserLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('exercises/', ExerciseListView.as_view(), name='exercise_list'),
    path('upload-exercise/', UploadExerciseView.as_view(), name='upload_exercise'),
    path('update-exercise/<int:pk>/', UpdateExerciseView.as_view(), name='update_exercise'),
]
