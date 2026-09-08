"""SIH26006 — Bearer token authentication for the API.

DRF's TokenAuthentication expects the ``Token`` scheme; the frontend sends
``Bearer``. This subclass accepts the Bearer scheme against the same
authtoken Token model. No new dependency, no session/CSRF involvement.
"""

from rest_framework.authentication import TokenAuthentication


class BearerTokenAuthentication(TokenAuthentication):
    keyword = 'Bearer'
