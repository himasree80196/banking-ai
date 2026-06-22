# API Reference

Base URL: `http://localhost:8000/api/v1`
Interactive docs: `http://localhost:8000/docs`

## Authentication

### POST /auth/register
Create a new user account.
```json
{ "email": "user@example.com", "username": "johndoe", "full_name": "John Doe", "password": "Test@1234" }
```

### POST /auth/login
Get access + refresh tokens.
```json
{ "email": "user@example.com", "password": "Test@1234" }
```

### POST /auth/refresh
Refresh access token.
```json
{ "refresh_token": "<refresh_token>" }
```

## Chat

All endpoints require `Authorization: Bearer <token>`.

### GET /chat/sessions — List all chat sessions
### GET /chat/sessions/{id} — Get session with messages
### POST /chat/send — Send a message
```json
{ "content": "What is the best savings account?", "session_id": null }
```
### DELETE /chat/sessions/{id} — Archive session

## Loan Prediction

### POST /loan/predict
```json
{
  "age": 30, "gender": "Male", "employment_status": "Employed",
  "occupation": "Engineer", "monthly_income": 8000, "existing_emi": 500,
  "loan_amount": 50000, "loan_tenure": 60, "credit_score": 750,
  "marital_status": "Single", "dependents": 0,
  "education": "Bachelor", "residential_status": "Rented"
}
```

### GET /loan/history?page=1&page_size=10&eligible_only=true
### GET /loan/history/{id}

## Admin (Admin role required)

### GET /admin/stats — Platform-wide statistics
### GET /admin/users — Paginated user list
### PUT /admin/users/{id}/toggle-active — Toggle user active status
### GET /admin/loans — All loan predictions
### GET /admin/audit-logs — Audit log entries
