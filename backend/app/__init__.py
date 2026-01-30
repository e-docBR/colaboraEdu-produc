"""Application factory for the Boletins Frei backend."""
from flask import Flask
from flask_cors import CORS
from loguru import logger

from .core.config import settings
from .core.database import init_db
from .core.security import jwt
from .api import register_blueprints
from .cli import register_cli


from werkzeug.middleware.proxy_fix import ProxyFix

def create_app() -> Flask:
    app = Flask(__name__)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    app.config.update(
        SECRET_KEY=settings.secret_key,
        JWT_SECRET_KEY=settings.jwt_secret_key,
        ENV=settings.environment,
        SQLALCHEMY_DATABASE_URI=settings.database_url,
        UPLOAD_FOLDER=settings.upload_folder,
        LOG_LEVEL=settings.log_level,
    )

    CORS(app, resources={r"/api/*": {"origins": settings.allowed_origins}})
    jwt.init_app(app)
    init_db(app)
    register_blueprints(app)
    register_cli(app)
    
    from .core.handlers import register_error_handlers
    register_error_handlers(app)
    
    from flask_migrate import Migrate
    from .core.database import Base
    Migrate(app, Base.metadata)

    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "message": "Boletins Frei API",
            "health": "/health",
            "docs": "/docs",
        }

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    logger.success("Flask app initialized with environment: {}", settings.environment)
    return app
