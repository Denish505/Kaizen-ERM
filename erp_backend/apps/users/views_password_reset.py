from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

User = get_user_model()

class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            # In a real app, send this link via email
            reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"
            print(f"PASSWORD RESET LINK for {email}: {reset_link}") # For development
            return Response({'status': 'success', 'message': 'Reset link sent'})
        except User.DoesNotExist:
            # Do not reveal user existence
            return Response({'status': 'success', 'message': 'Reset link sent'})

class SetNewPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')
        
        try:
            # Decode uid
            uid_str = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=uid_str)
            
            if default_token_generator.check_token(user, token):
                user.set_password(password)
                user.save()
                return Response({'status': 'success', 'message': 'Password reset successful'})
            else:
                return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)
