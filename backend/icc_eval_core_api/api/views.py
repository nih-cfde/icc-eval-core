from rest_framework import viewsets, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .permissions import CoreProjectAccessPermission, CoreProjectAccessQuerysetMixin
from .models import (
    Analytics,
    AnalyticsOverview,
    CoreProject,
    DRCDCC,
    DRCCode,
    DRCFile,
    Journal,
    Opportunity,
    Project,
    Publication,
    Repository,
    RepositoryOverview,
    User,
)
from .serializers import (
    AnalyticsOverviewSerializer,
    RepositoryListSerializer,
    DRCCodeSerializer,
    DRCDCCSerializer,
    DRCFileSerializer,
    JournalSerializer,
    OpportunitySerializer,
    ProjectSerializer,
    PublicationSerializer,
    RepositoryOverviewSerializer,
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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activity_code']
    search_fields = ['id', 'name', 'activity_code']
    ordering_fields = ['id', 'name', 'award_amount', 'publications', 'repos', 'analytics']
    ordering = ['id']


class RepositoryViewSet(CoreProjectAccessQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for repositories.

    The detail view includes a few large lists that aren't included in the list
    view for performance reasons, specifically: `stars`, `forks`, `commits`,
    `issues`, `pull_requests`
    """
    queryset = Repository.objects.select_related('core_project').all()
    serializer_class = RepositorySerializer
    permission_classes = [CoreProjectAccessPermission]
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


class AnalyticsViewSet(CoreProjectAccessQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for analytics.
    """
    queryset = Analytics.objects.select_related('core_project').all()
    serializer_class = AnalyticsSerializer
    permission_classes = [CoreProjectAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['core_project', 'property']
    search_fields = ['property', 'property_name']
    ordering_fields = ['property_name']
    ordering = ['property_name']

class OpportunityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for opportunities.
    """
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['prefix', 'activity_code']
    search_fields = ['id', 'prefix', 'activity_code']
    ordering_fields = ['id', 'prefix', 'activity_code']
    ordering = ['id']


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for projects.
    """
    queryset = Project.objects.select_related('core_project', 'opportunity').all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['core_project', 'opportunity', 'activity_code', 'agency_code', 'is_active']
    search_fields = ['id', 'name']
    ordering_fields = ['id', 'name', 'award_amount', 'date_start', 'date_end']
    ordering = ['id']


class JournalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for journals.
    """
    queryset = Journal.objects.all()
    serializer_class = JournalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['issn']
    search_fields = ['abbrev', 'name', 'title']
    ordering_fields = ['abbrev', 'title', 'rank']
    ordering = ['abbrev']


class PublicationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for publications.
    """
    queryset = Publication.objects.select_related('core_project', 'journal').all()
    serializer_class = PublicationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['core_project', 'journal', 'year']
    search_fields = ['title', 'doi']
    ordering_fields = ['id', 'year', 'modified', 'citations', 'relative_citation_ratio']
    ordering = ['-year', '-modified']


class DRCCodeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for DRC code entries.
    """
    queryset = DRCCode.objects.all()
    serializer_class = DRCCodeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'ext']
    search_fields = ['name', 'url', 'dir']
    ordering_fields = ['id', 'name', 'date']
    ordering = ['name']


class DRCDCCViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for DRC DCC entries.
    """
    queryset = DRCDCC.objects.all()
    serializer_class = DRCDCCSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ext']
    search_fields = ['name', 'url', 'dir']
    ordering_fields = ['id', 'name', 'date']
    ordering = ['name']


class DRCFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for DRC file entries.
    """
    queryset = DRCFile.objects.all()
    serializer_class = DRCFileSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ext']
    search_fields = ['name', 'url', 'dir']
    ordering_fields = ['id', 'name', 'date', 'size']
    ordering = ['name']


class RepoOverviewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for repository overview.

    Note that this model only ever contains one record, so we skip pagination
    and return just that model object rather than putting it in a list.
    """
    queryset = RepositoryOverview.objects.all()
    serializer_class = RepositoryOverviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['repos', 'stars', 'forks', 'watchers', 'commits']
    ordering = ['id']

    # disable pagination for this endpoint since it only returns one object
    pagination_class = None

    # rather than returning the queryset, we override the list method to return the single AnalyticsOverview object, or a default one if it doesn't exist
    def list(self, request, *args, **kwargs):
        overview = RepositoryOverview.objects.first()
        serializer = self.get_serializer(overview)
        return Response(serializer.data)

class AnalyticsOverviewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly API endpoint for analytics overview.

    Note that this model only ever contains one record, so we skip pagination
    and return just that model object rather than putting it in a list.
    """
    queryset = AnalyticsOverview.objects.all()
    serializer_class = AnalyticsOverviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['id']
    ordering = ['id']

    # disable pagination for this endpoint since it only returns one object
    pagination_class = None

    # rather than returning the queryset, we override the list method to return the single AnalyticsOverview object, or a default one if it doesn't exist
    def list(self, request, *args, **kwargs):
        overview = AnalyticsOverview.objects.first()
        serializer = self.get_serializer(overview)
        return Response(serializer.data)
