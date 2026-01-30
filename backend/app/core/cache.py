import json
from functools import wraps
from flask import g
import redis
from .config import settings

# Initialize redis client
redis_client = redis.from_url(settings.redis_url)

def cache_response(timeout=300, key_prefix="cache"):
    """
    Decorator to cache API responses in Redis.
    The cache key is sensitive to tenant_id and academic_year_id.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if settings.environment == "test":
                return f(*args, **kwargs)

            # Build cache key based on tenant, year, path and identity
            tenant_id = getattr(g, 'tenant_id', 'no_tenant')
            year_id = getattr(g, 'academic_year_id', 'no_year')
            
            # Simple unique key for the request
            from flask import request
            cache_key = f"{key_prefix}:{tenant_id}:{year_id}:{request.path}:{request.query_string.decode()}"
            
            try:
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    return json.loads(cached_data)
            except Exception as e:
                # Log or ignore redis failure
                pass

            response = f(*args, **kwargs)
            
            # Only cache 200 OK responses
            if isinstance(response, tuple):
                 return response # Don't cache if it has status code (might be error)
            
            try:
                # We assume the response is a flask response or a dict that jsonify will handle.
                # If it's a Response object, we need to handle it.
                # However, usually we return dicts in this project.
                # If it's a dict/list, we cache it.
                if isinstance(response, (dict, list)):
                    redis_client.setex(cache_key, timeout, json.dumps(response))
            except Exception as e:
                pass
                
            return response
        return decorated_function
    return decorator

def invalidate_tenant_cache():
    """Invalidates all cache for the current tenant."""
    tenant_id = getattr(g, 'tenant_id', None)
    if tenant_id:
        pattern = f"cache:{tenant_id}:*"
        for key in redis_client.scan_iter(pattern):
            redis_client.delete(key)
