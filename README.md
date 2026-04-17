# JWT Auth Backend

Express 4 + TypeScript + Zod — JWT authentication backend for protected routes.

## Stack

- **Express 4** — HTTP server
- **jsonwebtoken 9** — JWT sign/verify
- **bcryptjs** — password hashing
- **Zod 3** — request validation schemas
- **cookie-parser** — cookie support for Next.js Edge middleware compat
- **TypeScript 5** — full type safety

---

## Quick Start

```bash
# Install dependencies (using pnpm)
pnpm install

# Copy env file
cp .env.example .env

# Run dev server
pnpm dev
```

Server starts at `http://localhost:3001`

---

## Project Structure

```
src/
├── index.ts                      # Express app entry point
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── lib/
│   ├── db.ts                     # In-memory user store (singleton)
│   ├── jwt.ts                    # signToken() / verifyToken()
│   └── validation.ts             # Zod schemas (LoginSchema)
├── middleware/
│   ├── auth.middleware.ts        # withAuth() HOF + requireRole()
│   └── error.middleware.ts       # 404 + global error handler
└── routes/
    ├── auth.routes.ts            # /api/auth/*
    └── protected.routes.ts       # /api/protected/*
```

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/auth/login` | Login — returns JWT |
| POST | `/api/auth/logout` | Logout — clears cookie |

### Protected (requires `Authorization: Bearer <token>`)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/auth/me` | any | Re-verify token, return user |
| GET | `/api/protected` | any | Basic protected route |
| GET | `/api/protected/dashboard` | any | Role-aware dashboard data |
| GET | `/api/protected/profile` | any | User profile + permissions |
| GET | `/api/protected/admin` | admin | Admin-only route |

---

## Auth Flow

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "username": "admin", "role": "admin" }
  }
}
```

### 2. Access Protected Route
```http
GET /api/protected
Authorization: Bearer <token>
```

### 3. Re-verify Token (Next.js ProtectedRoute.tsx)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Test Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| john_doe | password123 | user |
| jane_smith | secret456 | user |

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 401 | Missing token / invalid token / expired token / wrong credentials |
| 403 | Valid token but insufficient role |
| 422 | Zod validation failed |
| 404 | Route not found |

---

## withAuth() Middleware

Every protected route is wrapped with `withAuth()`:

```ts
router.get("/profile", withAuth(async (req, res) => {
  // req.user is fully typed as UserPayload
  res.json({ user: req.user });
}));
```

Token is extracted from:
1. `Authorization: Bearer <token>` header
2. `token` cookie (fallback for Next.js Edge middleware)

## requireRole() Guard

Stacked after `withAuth` for role-based access:

```ts
router.get("/admin", withAuth(async (req, res, next) => {
  requireRole("admin")(req, res, () => {
    res.json({ secret: "admin data" });
  });
}));
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `JWT_SECRET` | (required) | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | 7d | Token expiry |
| `NODE_ENV` | development | Environment |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed CORS origin |
