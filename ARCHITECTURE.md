# Architecture Overview - After Migration

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                            │
│                    http://localhost:3000                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ React Application (IntelliLaw)                           │  │
│  │ ├── Login Page (Email/Password)                          │  │
│  │ ├── Dashboard                                            │  │
│  │ ├── Cases Management                                     │  │
│  │ ├── Team, Clients, Documents, etc.                       │  │
│  │ └── All pages use localStorage token for auth            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓↑                                    │
│                   AXIOS HTTP Requests                            │
│              Authorization: Bearer <JWT_TOKEN>                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓↑
           ┌────────────────────────────────────┐
           │  CORS-enabled (localhost:3000)     │
           └────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────────┐
│              EXPRESS BACKEND SERVER                             │
│             http://localhost:5000                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Endpoints:                                           │  │
│  │ ├── POST /api/auth/signup (Create user account)         │  │
│  │ ├── POST /api/auth/login (Get JWT token)                │  │
│  │ ├── GET /api/auth/me (Get current user)                 │  │
│  │ ├── GET /api/cases (List all cases)                     │  │
│  │ ├── POST /api/cases (Create case)                       │  │
│  │ ├── GET /api/cases/:id (Get single case)                │  │
│  │ ├── PUT /api/cases/:id (Update case)                    │  │
│  │ └── DELETE /api/cases/:id (Delete case)                 │  │
│  │                                                          │  │
│  │ Middleware:                                              │  │
│  │ ├── CORS - Allow frontend requests                       │  │
│  │ ├── JWT Auth - Verify request tokens                     │  │
│  │ └── Error handling                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓↑                                    │
│                  Mongoose ODM Layer                              │
│            (TypeScript models & validation)                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                 MONGODB DATABASE                                │
│             mongodb://localhost:27017                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ intellilaw (Database)                                     │  │
│  │ ├── users (Collection)                                    │  │
│  │ │   ├── _id: ObjectId                                     │  │
│  │ │   ├── email: String (unique)                            │  │
│  │ │   ├── password: String (bcrypt hashed)                  │  │
│  │ │   ├── displayName: String                               │  │
│  │ │   ├── role: String (ADMIN|LAWYER|CLIENT|STAFF)         │  │
│  │ │   └── timestamps                                        │  │
│  │ │                                                          │  │
│  │ ├── cases (Collection)                                    │  │
│  │ │   ├── _id: ObjectId                                     │  │
│  │ │   ├── title, caseNumber, category                       │  │
│  │ │   ├── priority, status, description                     │  │
│  │ │   ├── court, judge, clientName                          │  │
│  │ │   ├── assignedLawyerUid, assignedLawyerName             │  │
│  │ │   ├── nextHearingDate, lastActivityDate                 │  │
│  │ │   ├── tags                                              │  │
│  │ │   └── timestamps                                        │  │
│  │ │                                                          │  │
│  │ └── [Future] clients, teams, documents, hearings, etc    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: User Login

```
1. USER INPUT
   ┌──────────────────────┐
   │ Email: test@email.com│
   │ Password: ****       │
   └──────────────────────┘
           ↓
2. FRONTEND (React)
   ┌──────────────────────────────────────────────┐
   │ POST /api/auth/login                         │
   │ Body: {email, password}                      │
   │ (No auth header needed for login)            │
   └──────────────────────────────────────────────┘
           ↓
3. BACKEND (Express + Mongoose)
   ┌──────────────────────────────────────────────┐
   │ 1. Find user in MongoDB by email             │
   │ 2. Compare password using bcryptjs           │
   │ 3. If valid: Generate JWT token              │
   │ 4. Return token to frontend                  │
   └──────────────────────────────────────────────┘
           ↓
4. JWT TOKEN STORED
   ┌──────────────────────────────────────────────┐
   │ localStorage.setItem('token', response.token)│
   │                                              │
   │ Token contains:                              │
   │ {                                            │
   │   userId: "507f1f77bcf86cd799439011",       │
   │   email: "test@example.com",                 │
   │   exp: 1711412400 (24 hours from now)       │
   │ }                                            │
   └──────────────────────────────────────────────┘
           ↓
5. SUBSEQUENT REQUESTS
   ┌──────────────────────────────────────────────┐
   │ GET /api/cases                               │
   │ Header: Authorization: Bearer <JWT_TOKEN>    │
   │                                              │
   │ Backend validates token:                     │
   │ ├── Decode token with JWT_SECRET             │
   │ ├── Check if expired                         │
   │ ├── Extract userId                           │
   │ └── Proceed if valid                         │
   └──────────────────────────────────────────────┘
           ↓
6. RESPONSE TO FRONTEND
   ┌──────────────────────────────────────────────┐
   │ [{                                           │
   │   _id: "507f191e810c19729de860ea",          │
   │   title: "Case Name",                        │
   │   caseNumber: "2024-001",                    │
   │   status: "ACTIVE",                          │
   │   ...                                        │
   │ }]                                           │
   └──────────────────────────────────────────────┘
```

## Request-Response Cycle

```
REQUEST:
────────
frontend/services/caseService.ts
  ↓
axios.get(`${API_BASE_URL}/cases`, {
  headers: { Authorization: `Bearer ${token}` }
})
  ↓
HTTP GET /api/cases (with Bearer token)
  ↓
backend/src/routes/cases.ts
  ↓
authMiddleware (verify JWT token)
  ↓
Route handler (db query)
  ↓
MongoDB Query: Case.find().sort({ createdAt: -1 })
  ↓
Result: Array of cases from database


RESPONSE:
─────────
MongoDB returns documents
  ↓
backend/src/routes/cases.ts transforms { _id → id }
  ↓
Express sends JSON response with status 200
  ↓
Frontend receives response.data
  ↓
React renders case list on page
  ↓
User sees cases on screen
```

## Environment Configuration

```
Frontend (.env):
────────────────
VITE_API_URL=http://localhost:5000/api

Backend (.env):
───────────────
MONGODB_URI=mongodb://localhost:27017/intellilaw
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secret_key_change_in_production


During Development:
───────────────────
Frontend sends all requests to http://localhost:5000/api
Backend query database at mongodb://localhost:27017
JWT tokens expire after 24 hours


For Production:
───────────────
Frontend would point to production API URL
Backend would connect to MongoDB Atlas (cloud)
JWT_SECRET would be long secure string
```

## Key Components

### Frontend
- **Services**: API communication layer (authService, caseService, etc.)
- **Components**: UI components using React hooks
- **Context**: AuthProvider for managing user state
- **Storage**: localStorage for JWT tokens

### Backend
- **Models**: Mongoose schemas (User, Case, etc.)
- **Routes**: Express route handlers
- **Middleware**: JWT authentication, error handling
- **Server**: Express app initialization and DB connection

### Database
- **Collections**: User, Case, and future collections
- **Indexes**: email (unique) on users, caseNumber (unique) on cases
- **Validation**: Mongoose schema validation

## Security & Authentication

```
Password Flow:
──────────────
Plain password input
  ↓ (in frontend, never transmitted plain)
User submits {email, password}
  ↓
Backend receives
  ↓
bcryptjs.compare(inputPassword, hashedPasswordInDB)
  ↓
If match: Generate JWT token
  ↓
Token contains: userId, email, expiration
  ↓
Token sent to frontend via HTTPS (production)
  ↓
Frontend stores in localStorage
  ↓
Frontend includes token in Authorization header
  ↓
Backend verifies token with jwt.decode()
  ↓
Proceed with request if valid
```

## Error Handling

```
What if token is invalid?
─────────────────────────
Request comes with bad token
  ↓
authMiddleware catches error
  ↓
Returns 401 Unauthorized
  ↓
Frontend receives error
  ↓
Frontend clears localStorage
  ↓
Frontend redirects to /login


What if MongoDB is down?
────────────────────────
Backend tries to connect at startup
  ↓
mongoose.connect() fails
  ↓
Error logged to console
  ↓
Backend doesn't start (exits with code 1)
  ↓
Fix: Ensure MongoDB service is running


What if data validation fails?
──────────────────────────────
Frontend sends invalid data
  ↓
Express middleware parses JSON
  ↓
Mongoose schema validation runs
  ↓
Validation error thrown
  ↓
Error handler catches it
  ↓
Returns 400 Bad Request with error message
  ↓
Frontend displays error to user
```

This architecture is:
- ✅ Scalable (easy to add new endpoints)
- ✅ Secure (JWT tokens, password hashing)
- ✅ Type-safe (TypeScript on both frontend & backend)
- ✅ Modular (separation of concerns)
- ✅ Production-ready (with modifications)
