from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    RegisterStudentView,
    CurrentUserView,
    DashboardStatsView,
    StudentViewSet,
    CompanyViewSet,
    PlacementDriveViewSet,
    ApplicationViewSet,
    PlacementResultViewSet
)

# Standard REST router for ModelViewSets
router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'drives', PlacementDriveViewSet, basename='drive')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'results', PlacementResultViewSet, basename='result')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/register/', RegisterStudentView.as_view(), name='auth_register'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),

    # Placement analytics and dashboard KPIs
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),

    # Core REST CRUD endpoints
    path('', include(router.urls)),
]
