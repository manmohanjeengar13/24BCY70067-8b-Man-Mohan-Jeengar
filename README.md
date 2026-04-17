# 🔐 JWT Authentication Backend

**Name:** Man Mohan Jeengar  
**UID:** 24BCY70067

---

## 🎯 Aim

To develop a RESTful API for JWT-based authentication using Express.js, following MVC architecture with full CRUD operations, role-based access control, request validation using Zod, and comprehensive error handling.

---

## 🛠️ Hardware / Software Requirements

- Node.js 18+
- Express.js 4
- TypeScript 5
- pnpm
- Postman
- VS Code
- jsonwebtoken 9
- bcryptjs
- Zod 3

---

## 📦 Project Overview

This project builds a JWT authentication backend with secure token generation, password hashing, request validation, role-based access control (RBAC), and protected routes. The API uses an in-memory user store as a mock database, follows MVC architecture with centralized response handling, constants management, and proper TypeScript type safety.

---

## 📁 Folder Structure

```
jwt-auth-backend/
│
├── src/
│   ├── index.ts                      # Express app entry point
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript interfaces
│   ├── lib/
│   │   ├── db.ts                     # In-memory user store
│   │   ├── jwt.ts                    # signToken() / verifyToken()
│   │   ├── validation.ts             # Zod schemas (LoginSchema)
│   │   ├── response.ts               # Response builder utility
│   │   ├── constants.ts              # Centralized constants
│   │   └── config.ts                 # Config validation
│   ├── middleware/
│   │   ├── auth.middleware.ts        # withAuth() + requireRole()
│   │   └── error.middleware.ts       # 404 + global error handler
│   └── routes/
│       ├── auth.routes.ts            # /api/auth/*
│       └── protected.routes.ts       # /api/protected/*
├── dist/                             # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Navigate to the project directory

```bash
cd jwt-auth-backend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3001
JWT_SECRET=super-secret-jwt-key-for-development-only
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 4. Run the development server

```bash
pnpm dev
```

Server will start at: `http://localhost:3001`

---

## 📜 package.json Configuration

```json
{
  "name": "jwt-auth-backend",
  "version": "1.0.0",
  "description": "JWT Authentication Backend with Express, Zod validation",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "tsx": "^4.15.6",
    "typescript": "^5.4.5"
  }
}
```

---

## 🧠 Architecture (MVC Pattern)

### 1️⃣ Model — Data Layer

Manages in-memory user storage with singleton pattern.

**File:** `src/lib/db.ts`

```typescript
let usersCache: User[] | null = null;

export const getUsers = async (): Promise<User[]> => {
  if (!usersCache) {
    usersCache = await createUsers();
  }
  return usersCache;
};

export const findUserByUsername = async (username: string) => {
  const users = await getUsers();
  return users.find((u) => u.username === username);
};
```

### 2️⃣ Service — Business Logic

Handles JWT operations and password hashing.

**File:** `src/lib/jwt.ts`

```typescript
export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: AUTH.JWT_ISSUER,
    audience: AUTH.JWT_AUDIENCE,
  });
};

export const verifyToken = (token: string): UserPayload => {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: AUTH.JWT_ISSUER,
    audience: AUTH.JWT_AUDIENCE,
  });
  return decoded as UserPayload;
};
```

### 3️⃣ Controller — Request Handling

Handles validation, authentication, and responses.

**File:** `src/routes/auth.routes.ts`

```typescript
router.post("/login", async (req: Request, res: Response) => {
  const validation = validateBody(LoginSchema, req.body);
  if (!validation.success) {
    responses.validationError(res, errorMessage);
    return;
  }

  const user = await findUserByUsername(username);
  if (!user || !passwordMatch) {
    responses.unauthorized(res, ERRORS.INVALID_CREDENTIALS);
    return;
  }

  const token = signToken(payload);
  responses.success(res, "Login successful", { token, user });
});
```

### 4️⃣ Routes — API Endpoints

Defines protected and public endpoints.

**Files:** `src/routes/auth.routes.ts` and `src/routes/protected.routes.ts`

```typescript
router.post("/login", handler);
router.post("/logout", handler);
router.get("/me", withAuth(handler));
```

---

## 🔄 Middleware

### 1️⃣ CORS Support

Enables cross-origin requests from frontend clients.

```typescript
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
```

### 2️⃣ Custom Request Logger

Logs every incoming request with status code and execution time.

```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${color}${req.method} ${req.path}${reset} ${res.statusCode}`);
  });
  next();
});
```

**Example Terminal Output:**

```
GET /health HTTP/1.1
  {"message":"OK"}
  200

POST /api/auth/login HTTP/1.1
  {"message":"OK"}
  201

GET /api/protected/dashboard HTTP/1.1
  {"message":"OK"}
  200
```

### 3️⃣ Authentication Middleware

Protects routes by verifying JWT tokens.

```typescript
export const withAuth = (handler) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.slice(7);
    const decoded = verifyToken(token);
    req.user = decoded;
    await handler(req, res, next);
  };
};
```

### 4️⃣ Role-Based Access Control

Restricts access based on user role.

```typescript
export const requireRole = (...roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      responses.forbidden(res, "Access denied");
      return;
    }
    next();
  };
};
```

---

## 🌐 API Reference

**Base URL:** `http://localhost:3001`

### 🔹 GET /health

Health check endpoint. Returns server status and uptime.

**Example Request:**

```
GET http://localhost:3001/health
```

**Example Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "uptime": 125.34,
    "timestamp": "2026-04-17T10:30:00.000Z",
    "environment": "development"
  }
}
```

---

### 🔹 POST /api/auth/login

Authenticate user with username and password. Returns JWT token.

**Request Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Example Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "message": "Welcome admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

### 🔹 POST /api/auth/logout

Logout user by clearing authentication cookie.

**Example Request:**

```
POST http://localhost:3001/api/auth/logout
```

**Example Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 🔹 GET /api/auth/me

Get current authenticated user's information. Requires valid JWT token.

**Example Request:**

```
GET http://localhost:3001/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
```

**Example Response:**

```json
{
  "success": true,
  "message": "Authenticated",
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

### 🔹 GET /api/protected/dashboard

Retrieve dashboard data. Protected route requires authentication.

**Example Request:**

```
GET http://localhost:3001/api/protected/dashboard
Authorization: Bearer your_jwt_token
```

**Example Response:**

```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "user": { "id": 1, "username": "admin", "role": "admin" },
    "stats": {
      "lastLogin": "2026-04-17T10:30:00.000Z",
      "sessionActive": true,
      "role": "admin"
    },
    "items": ["Manage users", "View analytics", "System settings"]
  }
}
```

---

### 🔹 GET /api/protected/admin

Admin-only endpoint. Returns admin data and user management information.

**Example Request:**

```
GET http://localhost:3001/api/protected/admin
Authorization: Bearer admin_jwt_token
```

**Example Response (200 OK - Admin only):**

```json
{
  "success": true,
  "message": "Admin panel access granted",
  "data": {
    "adminUser": { "id": 1, "username": "admin", "role": "admin" },
    "adminContent": {
      "totalUsers": 3,
      "users": [
        { "id": 1, "username": "admin", "role": "admin" },
        { "id": 2, "username": "john_doe", "role": "user" },
        { "id": 3, "username": "jane_smith", "role": "user" }
      ],
      "systemStatus": "operational",
      "serverTime": "2026-04-17T10:30:00.000Z"
    }
  }
}
```

**Error Response (403 Forbidden - User role):**

```json
{
  "success": false,
  "message": "Access denied",
  "error": "Required role: admin. Your role: user"
}
```

---

### 🔹 GET /api/protected/profile

Retrieve authenticated user's profile and permissions.

**Example Request:**

```
GET http://localhost:3001/api/protected/profile
Authorization: Bearer your_jwt_token
```

**Example Response:**

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": 1,
    "username": "john_doe",
    "role": "user",
    "permissions": ["read"]
  }
}
```

---

## 🧪 Testing with Postman

### 1. Create a new Request

- Select HTTP method: `GET`, `POST`, `PUT`, `DELETE`
- Enter URL: `http://localhost:3001/api/auth/login`

### 2. For Authentication Requests (POST /api/auth/login)

- Go to **Body** → select **raw** → **JSON**
- Add request body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- Add header: `Content-Type: application/json`
- Click **Send**

### 3. For Protected Routes

- Copy the token from login response
- Go to **Headers** tab
- Add:
```
Key: Authorization
Value: Bearer your_token_here
```
- Click **Send**

### 4. Test Error Cases

- **Missing token:** Send request without Authorization header → 401 Unauthorized
- **Invalid token:** Use bad token → 401 Unauthorized
- **User accessing admin route:** Use user token on `/admin` → 403 Forbidden

---

## 📝 Test Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| john_doe | password123 | user |
| jane_smith | secret456 | user |

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Role-based access control (RBAC)
- ✅ Request validation with Zod
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ HTTP-only cookies support
- ✅ TypeScript type safety

---

## ✨ Key Improvements Made

- Centralized response builder utility
- Constants module for all magic strings
- Configuration validation at startup
- Proper error handling with consistent format
- Full TypeScript strict mode compliance
- Security warnings for production
🔐 JWT Authentication Backend
======= 🔐 JWT Authentication Backend

**Name:** Man Mohan Jeengar  
**UID:** 24BCY70067  

🎯 Aim
To develop a RESTful API for JWT-based authentication using Express.js, following MVC architecture with full CRUD operations, role-based access control, request validation using Zod, and comprehensive error handling.

🛠️ Hardware / Software Requirements
- Node.js 18+
- Express.js 4
- TypeScript 5
- pnpm
- Postman
- VS Code
- jsonwebtoken 9
- bcryptjs
- Zod 3

📦 Project Overview
This project builds a JWT authentication backend with secure token generation, password hashing, request validation, role-based access control (RBAC), and protected routes. The API uses an in-memory user store as a mock database, follows MVC architecture with centralized response handling, constants management, and proper TypeScript type safety.

📁 Folder Structure
jwt-auth-backend/
│
├── src/
│   ├── index.ts                      # Express app entry point
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript interfaces
│   ├── lib/
│   │   ├── db.ts                     # In-memory user store
│   │   ├── jwt.ts                    # signToken() / verifyToken()
│   │   ├── validation.ts             # Zod schemas (LoginSchema)
│   │   ├── response.ts               # Response builder utility
│   │   ├── constants.ts              # Centralized constants
│   │   └── config.ts                 # Config validation
│   ├── middleware/
│   │   ├── auth.middleware.ts        # withAuth() + requireRole()
│   │   └── error.middleware.ts       # 404 + global error handler
│   └── routes/
│       ├── auth.routes.ts            # /api/auth/*
│       └── protected.routes.ts       # /api/protected/*
├── dist/                             # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md

⚙️ Installation & Setup
1. Navigate to the project directory

cd jwt-auth-backend

2. Install dependencies

pnpm install

3. Configure environment variables

cp .env.example .env

Edit `.env`:
```
PORT=3001
JWT_SECRET=super-secret-jwt-key-for-development-only
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

4. Run the development server

pnpm dev

Server will start at: http://localhost:3001

📜 package.json Configuration
```json
{
  "name": "jwt-auth-backend",
  "version": "1.0.0",
  "description": "JWT Authentication Backend with Express, Zod validation",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "tsx": "^4.15.6",
    "typescript": "^5.4.5"
  }
}
```

🧠 Architecture (MVC Pattern)

1️⃣ Model — Data Layer
Manages in-memory user storage with singleton pattern.

File: `src/lib/db.ts`

```typescript
let usersCache: User[] | null = null;

export const getUsers = async (): Promise<User[]> => {
  if (!usersCache) {
    usersCache = await createUsers();
  }
  return usersCache;
};

export const findUserByUsername = async (username: string) => {
  const users = await getUsers();
  return users.find((u) => u.username === username);
};
```

2️⃣ Service — Business Logic
Handles JWT operations and password hashing.

File: `src/lib/jwt.ts`

```typescript
export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: AUTH.JWT_ISSUER,
    audience: AUTH.JWT_AUDIENCE,
  });
};

export const verifyToken = (token: string): UserPayload => {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: AUTH.JWT_ISSUER,
    audience: AUTH.JWT_AUDIENCE,
  });
  return decoded as UserPayload;
};
```

3️⃣ Controller — Request Handling
Handles validation, authentication, and responses.

File: `src/routes/auth.routes.ts`

```typescript
router.post("/login", async (req: Request, res: Response) => {
  const validation = validateBody(LoginSchema, req.body);
  if (!validation.success) {
    responses.validationError(res, errorMessage);
    return;
  }

  const user = await findUserByUsername(username);
  if (!user || !passwordMatch) {
    responses.unauthorized(res, ERRORS.INVALID_CREDENTIALS);
    return;
  }

  const token = signToken(payload);
  responses.success(res, "Login successful", { token, user });
});
```

4️⃣ Routes — API Endpoints
Defines protected and public endpoints.

File: `src/routes/auth.routes.ts` and `src/routes/protected.routes.ts`

```typescript
router.post("/login", handler);
router.post("/logout", handler);
router.get("/me", withAuth(handler));
```

🔄 Middleware

1️⃣ CORS Support
Enables cross-origin requests from frontend clients.

```typescript
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
```

2️⃣ Custom Request Logger
Logs every incoming request with status code and execution time.

```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${color}${req.method} ${req.path}${reset} ${res.statusCode}`);
  });
  next();
});
```

Example Terminal Output

```
GET /health HTTP/1.1
  {"message":"OK"}
  200

POST /api/auth/login HTTP/1.1
  {"message":"OK"}
  201

GET /api/protected/dashboard HTTP/1.1
  {"message":"OK"}
  200
```

3️⃣ Authentication Middleware
Protects routes by verifying JWT tokens.

```typescript
export const withAuth = (handler) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.slice(7);
    const decoded = verifyToken(token);
    req.user = decoded;
    await handler(req, res, next);
  };
};
```

4️⃣ Role-Based Access Control
Restricts access based on user role.

```typescript
export const requireRole = (...roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      responses.forbidden(res, "Access denied");
      return;
    }
    next();
  };
};
```

🌐 API Reference
Base URL: `http://localhost:3001`

🔹 GET /health
Health check endpoint. Returns server status and uptime.

Example Request

```
GET http://localhost:3001/health
```

Example Response

```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "uptime": 125.34,
    "timestamp": "2026-04-17T10:30:00.000Z",
    "environment": "development"
  }
}
```

🔹 POST /api/auth/login
Authenticate user with username and password. Returns JWT token.

Request Body

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Example Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "message": "Welcome admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

🔹 POST /api/auth/logout
Logout user by clearing authentication cookie.

Example Request

```
POST http://localhost:3001/api/auth/logout
```

Example Response

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

🔹 GET /api/auth/me
Get current authenticated user's information. Requires valid JWT token.

Example Request

```
GET http://localhost:3001/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
```

Example Response

```json
{
  "success": true,
  "message": "Authenticated",
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

🔹 GET /api/protected/dashboard
Retrieve dashboard data. Protected route requires authentication.

Example Request

```
GET http://localhost:3001/api/protected/dashboard
Authorization: Bearer your_jwt_token
```

Example Response

```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "user": { "id": 1, "username": "admin", "role": "admin" },
    "stats": {
      "lastLogin": "2026-04-17T10:30:00.000Z",
      "sessionActive": true,
      "role": "admin"
    },
    "items": ["Manage users", "View analytics", "System settings"]
  }
}
```

🔹 GET /api/protected/admin
Admin-only endpoint. Returns admin data and user management information.

Example Request

```
GET http://localhost:3001/api/protected/admin
Authorization: Bearer admin_jwt_token
```

Example Response (200 OK - Admin only)

```json
{
  "success": true,
  "message": "Admin panel access granted",
  "data": {
    "adminUser": { "id": 1, "username": "admin", "role": "admin" },
    "adminContent": {
      "totalUsers": 3,
      "users": [
        { "id": 1, "username": "admin", "role": "admin" },
        { "id": 2, "username": "john_doe", "role": "user" },
        { "id": 3, "username": "jane_smith", "role": "user" }
      ],
      "systemStatus": "operational",
      "serverTime": "2026-04-17T10:30:00.000Z"
    }
  }
}
```

Error Response (403 Forbidden - User role)

```json
{
  "success": false,
  "message": "Access denied",
  "error": "Required role: admin. Your role: user"
}
```

🔹 GET /api/protected/profile
Retrieve authenticated user's profile and permissions.

Example Request

```
GET http://localhost:3001/api/protected/profile
Authorization: Bearer your_jwt_token
```

Example Response

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": 1,
    "username": "john_doe",
    "role": "user",
    "permissions": ["read"]
  }
}
```

🧪 Testing with Postman

1. **Create a new Request**

   - Select HTTP method: `GET`, `POST`, `PUT`, `DELETE`
   - Enter URL: `http://localhost:3001/api/auth/login`

2. **For Authentication Requests (POST /api/auth/login)**

   - Go to **Body** → select **raw** → **JSON**
   - Add request body:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
   - Add header: `Content-Type: application/json`
   - Click **Send**

3. **For Protected Routes**

   - Copy the token from login response
   - Go to **Headers** tab
   - Add:
   ```
   Key: Authorization
   Value: Bearer your_token_here
   ```
   - Click **Send**

4. **Test Error Cases**

   - **Missing token:** Send request without Authorization header → 401 Unauthorized
   - **Invalid token:** Use bad token → 401 Unauthorized
   - **User accessing admin route:** Use user token on `/admin` → 403 Forbidden

📝 Test Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| john_doe | password123 | user |
| jane_smith | secret456 | user |

🔐 Security Features
- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Role-based access control (RBAC)
- ✅ Request validation with Zod
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ HTTP-only cookies support
- ✅ TypeScript type safety

✨ Key Improvements Made
- Centralized response builder utility
- Constants module for all magic strings
- Configuration validation at startup
- Proper error handling with consistent format
- Full TypeScript strict mode compliance
- Security warnings for production

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
