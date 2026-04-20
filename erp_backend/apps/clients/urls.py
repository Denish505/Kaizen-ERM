from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, LeadViewSet, ClientContactViewSet,
    DealViewSet, ContractViewSet
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'contacts', ClientContactViewSet)
router.register(r'deals', DealViewSet)
router.register(r'contracts', ContractViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
