from collections import OrderedDict

from django.urls import path, re_path
from rest_framework.routers import DefaultRouter, reverse
from .views import (
    OpportunityViewSet,
    ProjectViewSet,
    JournalViewSet,
    PublicationViewSet,
    DRCCodeViewSet,
    DRCDCCViewSet,
    DRCFileViewSet,
    CoreProjectViewSet,
    RepositoryViewSet,
    AnalyticsViewSet,
    RepoOverviewViewSet,
    AnalyticsOverviewViewSet,
)

from .auth_views import get_user_info, get_or_create_token, revoke_token

class APIRouter(DefaultRouter):
    '''
    Customized Default Router to include non-viewset views on root page
    '''
    single_views:list
    def __init__(self, single_views:list, *args, **kwargs):
        self.single_views = single_views
        self.trailing_slash = '/?'
        super().__init__(*args, **kwargs)

    def get_api_root_view(self, api_urls=None):
        """
        Return a basic root view.
        """
        api_root_dict = OrderedDict()
        list_name = self.routes[0].name
        for prefix, viewset, basename in self.registry:
            api_root_dict[prefix] = list_name.format(basename=basename)
        for single_view in self.single_views:
            sanitized_route = single_view['route'].rstrip('/?').rstrip('/')
            api_root_dict[sanitized_route] = single_view['name']
        return self.APIRootView.as_view(api_root_dict=api_root_dict)

single_views = [
    {
        'route': 'me',
        'view': get_user_info,
        'name': 'user-info'
    },
    # {
    #     'route': 'token',
    #     'view': get_or_create_token,
    #     'name': 'get-token'
    # },
    # {
    #     'route': 'token/revoke',
    #     'view': revoke_token,
    #     'name': 'revoke-token'
    # },
]

router = APIRouter(single_views=single_views)

router.register(r'core-projects', CoreProjectViewSet, basename='coreproject')
router.register(r'opportunities', OpportunityViewSet, basename='opportunity')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'journals', JournalViewSet, basename='journal')
router.register(r'publications', PublicationViewSet, basename='publication')
router.register(r'drc-code', DRCCodeViewSet, basename='drc-code')
router.register(r'drc-dcc', DRCDCCViewSet, basename='drc-dcc')
router.register(r'drc-file', DRCFileViewSet, basename='drc-file')
router.register(r'repositories', RepositoryViewSet, basename='repository')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'repo-overview', RepoOverviewViewSet, basename='repo-overview')
router.register(r'analytics-overview', AnalyticsOverviewViewSet, basename='analytics-overview')

urlpatterns = router.urls +[
    re_path(
        route=i['route'], view=i['view'], name=i['name']
    )
    for i in single_views
]
