from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import update_session_auth_hash
from .serializers import ChangePasswordSerializer
import logging

logger = logging.getLogger(__name__)

class ChangePasswordView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"Password change request from user: {request.user.email}")
        
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            update_session_auth_hash(request, user)  # Important, to keep session active
            
            logger.info(f"Password changed successfully for user: {user.email}")
            return Response({
                'status': 'success', 
                'message': 'Password updated successfully'
            }, status=status.HTTP_200_OK)
        
        logger.warning(f"Password change validation failed for user {request.user.email}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
