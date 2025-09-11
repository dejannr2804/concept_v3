from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, UserUpdateSerializer
from shops.spaces import upload_profile_image, delete_object_by_url, SpacesConfigError


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "user": UserSerializer(user).data,
                "token": token.key,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "user": UserSerializer(user).data,
                "token": token.key,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"user": UserSerializer(request.user).data})

    def patch(self, request):
        serializer = UserUpdateSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"user": UserSerializer(user).data})
        # Include a concise 'detail' message for convenience
        errors = serializer.errors
        # Try to pick the first field error as a human-readable detail
        detail = None
        try:
            for key in ["email", "username", *errors.keys()]:
                val = errors.get(key)
                if isinstance(val, (list, tuple)) and val:
                    detail = str(val[0])
                    break
                if isinstance(val, str):
                    detail = val
                    break
        except Exception:
            detail = None
        payload = {**errors}
        if detail and not payload.get("detail"):
            payload["detail"] = detail
        return Response(payload, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            token = Token.objects.get(user=request.user)
            token.delete()
        except Token.DoesNotExist:
            pass
        return Response({"detail": "Logged out"})


class ProfileImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file') or request.FILES.get('image')
        if not file:
            return Response({'detail': 'Missing file'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            url = upload_profile_image(file, getattr(file, 'name', 'image'))
        except SpacesConfigError as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Delete previous image best-effort
        prev = request.user.profile_image_url
        if prev:
            try:
                delete_object_by_url(prev)
            except Exception:
                pass
        request.user.profile_image_url = url
        request.user.save(update_fields=['profile_image_url'])
        return Response({'user': UserSerializer(request.user).data}, status=status.HTTP_200_OK)
