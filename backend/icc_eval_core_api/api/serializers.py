from rest_framework import serializers
from datetime import datetime
from .models import (
    User,
    Analytics,
    AnalyticsBreakdownUsers,
    AnalyticsBreakdownUsersEvents,
    AnalyticsOverview,
    CoreProject,
    DRCDCC,
    DRCCode,
    DRCFile,
    Event,
    Journal,
    Opportunity,
    Project,
    Publication,
    Repository,
    RepositoryOverview
)


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Base serializer to override return values for certain field types.
    """

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for name, field in self.fields.items():
            # Allow consumers to always rely on date fields being strings
            if isinstance(field, serializers.DateTimeField) and data.get(name) is None:
                data[name] = ''
        return data


class UserSerializer(BaseModelSerializer):
    """
    Serializer for the User model.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'orcid', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'orcid']


class CoreProjectSerializer(BaseModelSerializer):
    """
    Serializer for the CoreProject model.
    """

    award_amount = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = CoreProject
        fields = [
            'id',
            'name',
            'activity_code',
            'projects',
            'award_amount',
            'publications',
            'repositories',
            'analytics',
        ]

class RepositoryListSerializer(BaseModelSerializer):
    """
    Serializer for the Repository model (list view).

    Removes the following lengthy list fields for a faster response:
    - stars
    - forks
    - commits
    - issues
    - pull_requests
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    
    class Meta:
        model = Repository
        fields = [
            'id',
            'core_project',
            'owner',
            'name',
            'description',
            'topics',
            'created',
            'modified',
            'watchers',
            'contributors',
            'open_issues',
            'closed_issues',
            'issue_time_open',
            'open_pull_requests',
            'closed_pull_requests',
            'pull_request_time_open',
            'readme',
            'contributing',
            'code_of_conduct',
            'license',
            'languages',
            'dependencies',
        ]


class RepositorySerializer(BaseModelSerializer):
    """
    Serializer for the Repository model.
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    
    class Meta:
        model = Repository
        fields = [
            'id',
            'core_project',
            'owner',
            'name',
            'description',
            'topics',
            'created',
            'modified',
            'stars',
            'forks',
            'watchers',
            'commits',
            'issues',
            'pull_requests',
            'contributors',
            'open_issues',
            'closed_issues',
            'issue_time_open',
            'open_pull_requests',
            'closed_pull_requests',
            'pull_request_time_open',
            'readme',
            'contributing',
            'code_of_conduct',
            'license',
            'languages',
            'dependencies',
        ]


class AnalyticsBreakdownUsersSerializer(BaseModelSerializer):
    """
    Serializer for the AnalyticsBreakdownUsers model.
    """

    activeUsers = serializers.JSONField(source='active_users', read_only=True)
    newUsers = serializers.JSONField(source='new_users', read_only=True)
    returningUsers = serializers.JSONField(source='returning_users', read_only=True)

    class Meta:
        model = AnalyticsBreakdownUsers
        fields = ['activeUsers', 'newUsers', 'returningUsers']


class AnalyticsBreakdownUsersEventsSerializer(AnalyticsBreakdownUsersSerializer):
    """
    Serializer for the AnalyticsBreakdownUsersEvents model.
    """

    engagedSessions = serializers.JSONField(source='engaged_sessions', read_only=True)

    class Meta(AnalyticsBreakdownUsersSerializer.Meta):
        model = AnalyticsBreakdownUsersEvents
        fields = AnalyticsBreakdownUsersSerializer.Meta.fields + ['engagedSessions']


class AnalyticsSerializer(BaseModelSerializer):
    """
    Serializer for the Analytics model.
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    over_time = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    continents = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    countries = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    regions = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    cities = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    languages = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    devices = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    operating_systems = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    page_views = AnalyticsBreakdownUsersSerializer(read_only=True)

    class Meta:
        model = Analytics
        fields = [
            'id',
            'property',
            'property_name',
            'core_project',
            'over_time',
            'continents',
            'countries',
            'regions',
            'cities',
            'languages',
            'devices',
            'operating_systems',
            'page_views',
        ]


class OpportunitySerializer(BaseModelSerializer):
    """
    Serializer for the Opportunity model.
    """

    class Meta:
        model = Opportunity
        fields = ['id', 'prefix', 'activity_code']


class ProjectSerializer(BaseModelSerializer):
    """
    Serializer for the Project model.
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    opportunity = serializers.CharField(source='opportunity.id', read_only=True)
    award_amount = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = Project
        fields = [
            'id',
            'core_project',
            'name',
            'opportunity',
            'application',
            'award_amount',
            'fiscal_year',
            'activity_code',
            'agency_code',
            'date_start',
            'date_end',
            'is_active',
        ]


class JournalSerializer(BaseModelSerializer):
    """
    Serializer for the Journal model.
    """

    class Meta:
        model = Journal
        fields = ['abbrev', 'name', 'issn', 'title', 'rank']


class PublicationSerializer(BaseModelSerializer):
    """
    Serializer for the Publication model.
    """
    core_project = serializers.CharField(source='core_project.id', read_only=True)
    journal = serializers.CharField(source='journal.abbrev', read_only=True)

    class Meta:
        model = Publication
        fields = [
            'id',
            'core_project',
            'application',
            'title',
            'authors',
            'journal',
            'year',
            'modified',
            'doi',
            'relative_citation_ratio',
            'citations',
            'citations_per_year',
        ]


class DRCCodeSerializer(BaseModelSerializer):
    """
    Serializer for the DRCCode model.
    """

    class Meta:
        model = DRCCode
        fields = ['id', 'url', 'dir', 'name', 'ext', 'type', 'date', 'files']


class DRCDCCSerializer(BaseModelSerializer):
    """
    Serializer for the DRCDCC model.
    """

    class Meta:
        model = DRCDCC
        fields = ['id', 'url', 'dir', 'name', 'ext', 'date', 'files']


class DRCFileSerializer(BaseModelSerializer):
    """
    Serializer for the DRCFile model.
    """

    class Meta:
        model = DRCFile
        fields = ['id', 'url', 'dir', 'name', 'ext', 'size', 'date', 'files']


class RepositoryOverviewSerializer(BaseModelSerializer):
    """
    Serializer for the RepositoryOverview model.
    """

    class Meta:
        model = RepositoryOverview
        fields = [
            # 'id',
            'repositories',
            'stars',
            'forks',
            'watchers',
            'commits',
            'open_issues',
            'closed_issues',
            'open_pull_requests',
            'closed_pull_requests',
            'readme',
            'contributing',
            'code_of_conduct',
            'contributors',
            'licenses',
            'languages',
        ]


class AnalyticsOverviewSerializer(BaseModelSerializer):
    """
    Serializer for the AnalyticsOverview model.
    """
    over_time = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    continents = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    countries = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    regions = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    cities = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    languages = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    devices = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    operating_systems = AnalyticsBreakdownUsersEventsSerializer(read_only=True)
    page_views = AnalyticsBreakdownUsersSerializer(read_only=True)

    class Meta:
        model = AnalyticsOverview
        fields = [
            # 'id',
            'over_time',
            'continents',
            'countries',
            'regions',
            'cities',
            'languages',
            'devices',
            'operating_systems',
            'page_views',
        ]


class EventSerializer(BaseModelSerializer):
    """
    Serializer for the Event model.
    """

    class Meta:
        model = Event
        fields = [
            'id',
            'status',
            'edit',
            'calendar_id',
            'timestamp',
            'email_address',
            'title',
            'description',
            'organizer',
            'involved',
            'length',
            'start',
            'end',
            'link',
            'format',
            'location',
            'purpose',
            'tags',
            'attendance_outcome',
            'engagement_outcome',
            'awareness_outcome',
            'resources_outcome',
            'timing_outcome',
            'platform_outcome',
            'conclusion',
        ]
