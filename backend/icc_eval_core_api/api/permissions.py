from rest_framework.permissions import BasePermission

from .models import ORCIDProjectMap


class CoreProjectAccessPermission(BasePermission):
    """
    Grants access when a user is allowed to view a given core project.

    Rules:
    - superusers can view everything
    - ORCID mapping with '*' can view everything
    - ORCID mapping with explicit project IDs can view only those projects
    """

    message = 'You do not have access to this core project.'

    @classmethod
    def get_allowed_core_project_ids(cls, user):
        if not user or not user.is_authenticated:
            return set()

        if user.is_superuser:
            return None

        orcid = getattr(user, 'orcid', None)
        if not orcid:
            return set()

        try:
            mapping = ORCIDProjectMap.objects.only('core_projects').get(orcid=orcid)
        except ORCIDProjectMap.DoesNotExist:
            return set()

        core_projects = mapping.core_projects or []
        if '*' in core_projects:
            return None

        return {str(project_id) for project_id in core_projects}

    @classmethod
    def user_has_core_project_access(cls, user, core_project_id):
        allowed_core_project_ids = cls.get_allowed_core_project_ids(user)

        if allowed_core_project_ids is None:
            return True

        if core_project_id is None:
            return False

        return str(core_project_id) in allowed_core_project_ids

    @classmethod
    def get_object_core_project_id(cls, obj):
        if hasattr(obj, 'core_project_id'):
            return obj.core_project_id

        # CoreProject objects do not have core_project_id; use their own id.
        return getattr(obj, 'id', None)

    @classmethod
    def filter_queryset_for_user(cls, queryset, user, core_project_field='core_project_id'):
        allowed_core_project_ids = cls.get_allowed_core_project_ids(user)

        if allowed_core_project_ids is None:
            return queryset

        if not allowed_core_project_ids:
            return queryset.none()

        return queryset.filter(**{f'{core_project_field}__in': list(allowed_core_project_ids)})

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        core_project_id = self.get_object_core_project_id(obj)
        return self.user_has_core_project_access(request.user, core_project_id)


class CoreProjectAccessQuerysetMixin:
    """
    Restricts a viewset queryset to only core projects a user can access.
    """

    core_project_lookup_field = 'core_project_id'

    def get_queryset(self):
        queryset = super().get_queryset()
        return CoreProjectAccessPermission.filter_queryset_for_user(
            queryset,
            self.request.user,
            core_project_field=self.core_project_lookup_field,
        )
