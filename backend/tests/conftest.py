import os
import pytest
from sqlalchemy import create_engine
from app import create_app
from app.core.database import Base, SessionLocal
import app.core.database
from app.models import Usuario
from app.core.security import hash_password

@pytest.fixture(scope="session")
def db_engine():
    db_path = "test_boletins.db"
    db_url = f"sqlite:///{db_path}"
    
    # Create test engine
    test_engine = create_engine(db_url, connect_args={"check_same_thread": False})
    
    # Patch the global engine and SessionLocal
    app.core.database.engine = test_engine
    SessionLocal.configure(bind=test_engine)
    
    # Create tables
    Base.metadata.create_all(bind=test_engine)
    
    yield test_engine
    
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(db_path):
        os.remove(db_path)

@pytest.fixture(scope="session")
def flask_app(db_engine):
    # We don't need to reload config if we patched the database engine/session
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    return app

@pytest.fixture(scope="function")
def client(flask_app):
    return flask_app.test_client()

@pytest.fixture(scope="function")
def session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    
    # Bind session to the connection
    session = SessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def admin_user(session):
    user = Usuario(
        username="admin_test",
        password_hash=hash_password("admin123"),
        role="admin",
        is_admin=True
    )
    session.add(user)
    session.commit()
    return user

@pytest.fixture(scope="function")
def auth_headers(client, admin_user):
    response = client.post("/api/v1/auth/login", json={
        "username": "admin_test",
        "password": "admin123"
    })
    token = response.json["access_token"]
    return {"Authorization": f"Bearer {token}"}
