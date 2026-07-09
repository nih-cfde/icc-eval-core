"""
Custom authentication views for API token-based authentication.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """
    Get information about the currently authenticated user.
    Includes ORCID if available.
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'orcid': user.orcid,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_or_create_token(request):
    """
    Get or create an authentication token for the current user.
    This endpoint is useful after OAuth login to get a token for API access.
    """
    token, created = Token.objects.get_or_create(user=request.user)
    return Response({
        'token': token.key,
        'created': created,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'orcid': request.user.orcid,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_token(request):
    """
    Revoke the current user's authentication token.
    """
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({
            'message': 'Token successfully revoked'
        }, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response({
            'message': 'No token found for user'
        }, status=status.HTTP_404_NOT_FOUND)
