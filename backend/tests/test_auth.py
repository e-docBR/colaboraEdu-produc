import io

def test_login_success(client, admin_user):
    response = client.post("/api/v1/auth/login", json={
        "username": "admin_test",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json
    assert "access_token" in data
    assert data["user"]["username"] == "admin_test"

def test_login_failure(client):
    response = client.post("/api/v1/auth/login", json={
        "username": "wrong",
        "password": "wrong"
    })
    assert response.status_code == 401

def test_change_password(client, auth_headers):
    # Change password
    response = client.post("/api/v1/auth/change-password", headers=auth_headers, json={
        "current_password": "admin123",
        "new_password": "newpassword123"
    })
    assert response.status_code == 204

    # Login with new password
    response = client.post("/api/v1/auth/login", json={
        "username": "admin_test",
        "password": "newpassword123"
    })
    assert response.status_code == 200

def test_upload_photo(client, auth_headers):
    data = {
        "file": (io.BytesIO(b"fake image data"), "test_photo.jpg")
    }
    response = client.post(
        "/api/v1/usuarios/me/photo",
        headers=auth_headers,
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    assert "photo_url" in response.json
    assert "test_photo.jpg" in response.json["photo_url"]
