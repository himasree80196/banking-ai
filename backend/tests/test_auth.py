"""Tests for authentication endpoints."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.database import init_db
from main import app


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(scope="session")
async def client():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_health(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


@pytest.mark.anyio
async def test_register(client):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "Test@1234",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"


@pytest.mark.anyio
async def test_login(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Test@1234",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.anyio
async def test_login_wrong_password(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword",
    })
    assert resp.status_code == 401
