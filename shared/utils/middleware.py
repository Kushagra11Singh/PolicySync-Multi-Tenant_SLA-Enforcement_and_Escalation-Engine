import threading

_thread_local = threading.local()


def get_current_tenant():
    return getattr(_thread_local, "tenant", None)


def set_current_tenant(tenant):
    _thread_local.tenant = tenant


class TenantMiddleware:
    """
    Attaches request.tenant from the authenticated user.
    Viewsets filter querysets by this — never expose cross-tenant data.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = None
        response = self.get_response(request)
        # Tenant is set by viewsets after JWT is decoded — middleware
        # just initialises the attribute so nothing blows up pre-auth.
        return response
