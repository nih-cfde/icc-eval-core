"""
Base URL configuration for icc_eval_core_api project.

See the 'api' app's urls.py for API endpoint definitions.
"""

from django.contrib import admin
from django.urls import path
from django.conf import settings

# import api.urls, and include it in urlpatterns
from django.urls import include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),

    # add DRF auth urls
    path('api-auth/', include('rest_framework.urls')),

    # Authentication URLs for admin UI (session-based)
    path("accounts/", include("allauth.urls")),

    # # API authentication endpoints (token-based)
    # path("api/auth/", include("dj_rest_auth.urls")),
    # path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
]

# serve static files in development
if settings.DEBUG:
    from django.conf.urls.static import static

    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
