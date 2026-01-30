from flask import request, g, jsonify
from functools import wraps
from app.core.database import session_scope
from app.services.tenant_service import TenantService

def resolve_tenant_context():
    """
    Logic to resolve tenant and academic year from JWT, Host and headers.
    Sets g.tenant, g.tenant_id, and g.academic_year_id.
    Returns a Flask response if an error occurs, else None.
    """
    from flask_jwt_extended import get_jwt, verify_jwt_in_request
    from flask_jwt_extended.exceptions import NoAuthorizationError, JWTExtendedException
    
    tenant_id = None
    
    # 0. Ensure JWT is verified if present
    try:
        verify_jwt_in_request(optional=True)
    except JWTExtendedException:
        pass

    # 1. Try to get tenant_id from Header (priority for context switching)
    tenant_id = request.headers.get("X-Tenant-ID")
    if tenant_id and tenant_id.isdigit():
        tenant_id = int(tenant_id)
    else:
        # 2. Try to get tenant_id from JWT
        try:
            claims = get_jwt()
            tenant_id = claims.get("tenant_id")
        except (NoAuthorizationError, RuntimeError):
            tenant_id = None

    host = request.headers.get("Host", "").split(":")[0] # remove port
    
    with session_scope() as session:
        service = TenantService(session)
        tenant = None
        
        if tenant_id is not None:
            tenant = service.repository.get(tenant_id)
        
        if not tenant:
            tenant = service.resolve_tenant(host)
        
        # DEV MODE FALLBACK
        if not tenant and (host == "localhost" or host == "127.0.0.1"):
             tenant = service.repository.get(1)
             if not tenant:
                 # If tenant 1 doesn't exist, pick the first one available
                 tenant = session.query(service.repository.model).first()
        
        if not tenant:
            return jsonify({"error": "Inquilino não identificado ou inválido"}), 404
        
        if not tenant.is_active:
             return jsonify({"error": "Acesso desativado para esta instituição"}), 403
        
        # Store in Flask GLOBAL g
        g.tenant = tenant
        g.tenant_id = tenant.id

        # 2. Resolve Academic Year
        # Priority: JWT claim -> Header -> Default current
        year_id = None
        
        # Try JWT first
        try:
            claims = get_jwt()
            if claims and "academic_year_id" in claims:
                year_id = claims["academic_year_id"]
        except (NoAuthorizationError, RuntimeError):
            pass

        # Try Header if not in JWT
        if not year_id:
            header_val = request.headers.get("X-Academic-Year-ID")
            if header_val and header_val.isdigit():
                year_id = int(header_val)

        if year_id:
            g.academic_year_id = year_id
        else:
            # Logic to find the current active academic year for this tenant
            from app.models.academic_year import AcademicYear
            current_year = session.query(AcademicYear).filter(
                AcademicYear.tenant_id == tenant.id,
                AcademicYear.is_current == True
            ).first()
            if current_year:
                g.academic_year_id = current_year.id
            else:
                g.academic_year_id = None
    return None

def tenant_required():
    """
    Decorator to ensure a valid tenant is present.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            error_response = resolve_tenant_context()
            if error_response:
                return error_response
            return f(*args, **kwargs)
        return decorated_function
    return decorator

