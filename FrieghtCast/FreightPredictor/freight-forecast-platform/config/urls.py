"""
Root URL configuration for SIH26006 Freight Forecasting Platform.

Routes all API endpoints under /api/v1/ via the app's URL module.
Admin site available at /admin/.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('app.urls')),
]
