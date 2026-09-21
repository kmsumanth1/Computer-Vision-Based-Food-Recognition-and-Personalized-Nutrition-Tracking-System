from app.services import email_service
from tests.conftest import PROFILE


def test_register_login_flow(client):
    res = client.post("/auth/register", json={"name": "  Asha ", "email": "Asha@Example.com", "password": "password123"})
    assert res.status_code == 201
    body = res.json()
    assert body["token_type"] == "bearer" and body["access_token"]
    assert body["user"] == {"id": body["user"]["id"], "name": "Asha", "email": "asha@example.com", "profile_completed": False}

    res = client.post("/auth/login", json={"email": "ASHA@example.com", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "asha@example.com"


def test_duplicate_email(client, auth):
    res = client.post("/auth/register", json={"name": "Other", "email": "ravi@example.com", "password": "password123"})
    assert res.status_code == 409
    assert res.json()["detail"]["code"] == "EMAIL_EXISTS"


def test_bad_credentials_look_identical(client, auth):
    wrong_password = client.post("/auth/login", json={"email": "ravi@example.com", "password": "nope-nope"})
    unknown_email = client.post("/auth/login", json={"email": "nobody@example.com", "password": "password123"})
    for res in (wrong_password, unknown_email):
        assert res.status_code == 401
        assert res.json()["detail"]["code"] == "INVALID_CREDENTIALS"
    assert wrong_password.json() == unknown_email.json()


def test_register_validation(client):
    short = client.post("/auth/register", json={"name": "A", "email": "a@example.com", "password": "short"})
    assert short.status_code == 422
    assert isinstance(short.json()["detail"], list)  # FastAPI's default shape, which the frontend handles
    bad_email = client.post("/auth/register", json={"name": "A", "email": "not-an-email", "password": "password123"})
    assert bad_email.status_code == 422


def test_profile_completed_flag_after_setup(client, auth):
    client.post("/profile/setup", json=PROFILE, headers=auth)
    res = client.post("/auth/login", json={"email": "ravi@example.com", "password": "password123"})
    assert res.json()["user"]["profile_completed"] is True


def test_protected_routes_need_a_valid_token(client):
    for headers in ({}, {"Authorization": "Bearer nonsense"}):
        res = client.get("/profile", headers=headers)
        assert res.status_code == 401
        assert res.json()["detail"]["code"] == "UNAUTHORIZED"


def test_forgot_password_never_reveals_accounts(client, auth, monkeypatch):
    sent = []
    monkeypatch.setattr("app.services.auth_service.send_email", lambda **kw: sent.append(kw))
    known = client.post("/auth/forgot-password", json={"email": "ravi@example.com"})
    unknown = client.post("/auth/forgot-password", json={"email": "ghost@example.com"})
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json() == {"message": "Password reset instructions have been sent to your email."}
    assert len(sent) == 1 and sent[0]["to"] == "ravi@example.com"


def test_reset_password_flow(client, auth, monkeypatch):
    sent = []
    monkeypatch.setattr("app.services.auth_service.send_email", lambda **kw: sent.append(kw))
    client.post("/auth/forgot-password", json={"email": "ravi@example.com"})
    token = sent[0]["body"].split("token=")[1].split()[0]

    assert client.post("/auth/reset-password", json={"token": token, "password": "brand-new-pass"}).status_code == 200
    assert client.post("/auth/login", json={"email": "ravi@example.com", "password": "password123"}).status_code == 401
    assert client.post("/auth/login", json={"email": "ravi@example.com", "password": "brand-new-pass"}).status_code == 200

    reuse = client.post("/auth/reset-password", json={"token": token, "password": "another-pass-1"})
    assert reuse.status_code == 400 and reuse.json()["detail"]["code"] == "INVALID_RESET_TOKEN"
    bogus = client.post("/auth/reset-password", json={"token": "x" * 40, "password": "another-pass-1"})
    assert bogus.status_code == 400


def test_email_service_logs_when_smtp_missing(caplog):
    with caplog.at_level("WARNING", logger="afcm.email"):
        email_service.send_email("a@example.com", "Hi", "Body")
    assert "SMTP is not configured" in caplog.text
