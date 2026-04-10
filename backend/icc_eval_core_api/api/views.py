import json
import os

from rest_framework import viewsets, filters
from rest_framework.response import Response
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import ORCIDProjectMap, User, CoreProject, Repository, Analytics
from .serializers import (
    RepositoryListSerializer,
    UserSerializer,
    CoreProjectSerializer,
    RepositorySerializer,
    AnalyticsSerializer,
)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined']
    ordering = ['username']


class CoreProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for core projects.
    """
    queryset = CoreProject.objects.all()
    serializer_class = CoreProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activity_code']
    search_fields = ['id', 'name', 'activity_code']
    ordering_fields = ['id', 'name', 'award_amount', 'publications', 'repos', 'analytics']
    ordering = ['id']

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return CoreProject.objects.all()
        elif user.is_authenticated:
            # For regular users, filter core projects based on their ORCID
            orcid = user.orcid
            if orcid:
                try:
                    mapping = ORCIDProjectMap.objects.get(orcid=orcid)
                    core_project_ids = mapping.core_projects
                    
                    # the special value '*' means the user has access to all core projects
                    if '*' in core_project_ids:
                        return CoreProject.objects.all()
                    
                    return CoreProject.objects.filter(id__in=core_project_ids)
                except ORCIDProjectMap.DoesNotExist:
                    return CoreProject.objects.none()

        return CoreProject.objects.none()


class RepositoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for repositories.

    The detail view includes a few large lists that aren't included in the list
    view for performance reasons, specifically: `stars`, `forks`, `commits`,
    `issues`, `pull_requests`
    """
    queryset = Repository.objects.select_related('core_project').all()
    serializer_class = RepositorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['core_project', 'owner', 'license', 'readme', 'contributing', 'code_of_conduct']
    search_fields = ['name', 'owner', 'description']
    ordering_fields = ['name', 'owner', 'created', 'modified', 'open_issues', 'open_pull_requests']
    ordering = ['-created']

    def get_serializer_class(self):
        # if the request came with the query param all=true, use the full serializer with all fields
        if self.request.query_params.get('all', 'false').lower() == 'true':
            return RepositorySerializer
        
        if self.action == 'list':
            return RepositoryListSerializer
        return RepositorySerializer


class AnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for analytics.
    """
    queryset = Analytics.objects.select_related('core_project').all()
    serializer_class = AnalyticsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['core_project', 'property']
    search_fields = ['property', 'property_name']
    ordering_fields = ['property_name']
    ordering = ['property_name']

class RepoOverviewViewSet(viewsets.ViewSet):
    """
    ReadOnly API endpoint for repository overview.
    Unlike other db-backed endpoints, this endpoint serves data from a static
    JSON file generated from the repo-overview.json in the data directory.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # load the data from {DATA_DIR}/repo-overview.json and return it as a response
        # (DATA_DIR will usually be /data in production)
        file_path = os.path.join(settings.DATA_DIR, 'repo-overview.json')
        with open(file_path, 'r') as f:
            data = json.load(f)
        return Response(data)

class AnalyticsOverviewViewSet(viewsets.ViewSet):
    """
    ReadOnly API endpoint for analytics overview.
    Unlike other db-backed endpoints, this endpoint serves data from a static
    JSON file generated from the analytics-overview.json in the data directory.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # load the data from {DATA_DIR}/repo-overview.json and return it as a response
        # (DATA_DIR will usually be /data in production)
        file_path = os.path.join(settings.DATA_DIR, 'analytics-overview.json')
        with open(file_path, 'r') as f:
            data = json.load(f)
        return Response(data)
