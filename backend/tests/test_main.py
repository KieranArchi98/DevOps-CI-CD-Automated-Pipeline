from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_startup():
    """Test that the application starts and basic routes are available."""
    response = client.get("/")
    # If there's no root route, it might be 404, but we check if server responds
    assert response.status_code in [200, 404]


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_response_schema():
    """Test that the response follows the expected schema."""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert isinstance(data["status"], str)
