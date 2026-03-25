# 🔐 Role-Based Access Control & Google OAuth Setup Guide

## Overview

Your IntelliLaw application now supports:
- **Google OAuth 2.0** - Sign in with Google
- **Role-Based Access Control (RBAC)** - Admin, Lawyer, Staff, Client
- **Admin Dashboard** - Create and manage users and roles

---

## Part 1: Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project:
   - Click "Select a Project" → "NEW PROJECT"
   - Project name: "IntelliLaw"
   - Click "Create"

### Step 2: Enable Google+ API

1. Search for "Google+ API" in the search bar
2. Click "Google+ API"
3. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to **Credentials** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. You might see "You need to configure the OAuth consent screen first"
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Choose **"External"**
   - Fill in required fields:
     - App name: IntelliLaw
     - User support email: your_email@example.com
     - Developer contact: your_email@example.com
   - Click "Save and Continue"
   - Skip optional fields, click "Save and Continue"
   - Click "Back to Dashboard"

4. Back in Credentials, click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Select **"Web application"**
6. Add Authorized redirect URIs:
   ```
   http://localhost:5000/api/auth/google/callback
   http://localhost:3000/
   http://localhost:3001/
   ```
7. Click "Create"
8. Copy your **Client ID** and **Client Secret**

### Step 4: Update Backend .env

```bash
cd /home/abdullah/Desktop/IntelliLaw/backend
```

Edit `.env` file and replace:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

---

## Part 2: Role-Based Access Control Setup

### User Roles

| Role | Permissions | Access |
|------|------------|--------|
| **ADMIN** | All | Full system access, user management, all features |
| **LAWYER** | Read/Write Cases, Team | Manage cases, view team, manage clients |
| **STAFF** | Read Cases, Limited Write | View cases, create basic records |
| **CLIENT** | Read Own Data | View own cases, documents, messages |

### Step 1: Install Backend Dependencies

```bash
cd /home/abdullah/Desktop/IntelliLaw/backend
npm install
```

### Step 2: Create First Admin User

Use the admin setup endpoint to create the first admin user:

```bash
curl -X POST http://localhost:5000/api/auth/admin/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "displayName": "Admin User"
  }'
```

**Response:**
```json
{
  "message": "Admin user created successfully",
  "_id": "...",
  "email": "admin@example.com",
  "displayName": "Admin User",
  "role": "ADMIN",
  "token": "..."
}
```

⚠️ **Important:** After creating the first admin, this endpoint will reject any further admin creation attempts. Only the existing admin can create new admins.

### Step 3: Admin User Management

Once logged in as Admin, you can manage user roles using the admin API:

```bash
# Change a user's role to LAWYER
curl -X POST http://localhost:5000/api/auth/admin/change-role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id_from_database",
    "newRole": "LAWYER"
  }'
```

Allowed roles: `ADMIN`, `LAWYER`, `STAFF`, `CLIENT`

---

## Part 3: Run Everything with OAuth Support

### Terminal 1: MongoDB
```bash
mongod
# MongoDB should be running (already started from before)
```

### Terminal 2: Backend Server
```bash
cd /home/abdullah/Desktop/IntelliLaw/backend
npm run dev
```

You should see:
```
✅ Connected to MongoDB
✅ Backend server running on http://localhost:5000
```

### Terminal 3: Frontend React App
```bash
cd /home/abdullah/Desktop/IntelliLaw
npm run dev
```

You should see:
```
VITE ...
➜  Local:   http://localhost:3000/
```

---

## Part 4: Test the System

### Test 1: Sign in with Google

1. Open http://localhost:3000
2. Click **"Sign in with Google"** button
3. Select your Google account
4. You should be redirected to dashboard
5. You're automatically assigned **CLIENT** role

### Test 2: Create Admin User

1. Stop the backend server (Ctrl+C)
2. Make sure .env has GOOGLE credentials filled in
3. Restart backend: `npm run dev`
4. Create admin user:
   ```bash
   curl -X POST http://localhost:5000/api/auth/admin/setup-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@intellilaw.com",
       "password": "Admin123!",
       "displayName": "IntelliLaw Admin"
     }'
   ```
5. Copy the token from response
6. Go to http://localhost:3000 and login with admin email/password
7. You now have **ADMIN** privileges

### Test 3: Role-Based Features (Coming Soon)

Different menu items and dashboards will be visible based on user role:

**ADMIN** sees:
- User Management
- System Settings
- All Reports
- All Cases

**LAWYER** sees:
- My Cases
- Client Management
- Team Members
- My Reports

**STAFF** sees:
- Assigned Cases
- Limited Client View
- My Tasks

**CLIENT** sees:
- My Cases
- My Documents
- My Messages
- Case Updates

---

## Part 5: Role-Based Frontend Implementation (Next Steps)

The frontend needs to be updated with role-based visibility:

### Already Done:
✅ Google Sign-In button added to Login page
✅ Role stored in JWT token
✅ Backend RBAC middleware created

### Still Needed:
⏳ Route guards for role-based access
⏳ Sidebar menu items filtered by role
⏳ Dashboard variants for each role
⏳ Permission checks on forms/actions

These will be implemented as the next phase.

---

## Part 6: Troubleshooting

| Issue | Solution |
|-------|----------|
| Google Sign-In shows error | Verify Client ID and Secret in `.env` are correct |
| "Admin already exists" | Means admin is already created. Delete the user from MongoDB and try again if needed |
| "Invalid token" | Token expired after 24 hours. Login again |
| Google OAuth callback fails | Check CALLBACK_URL in .env matches exactly: `http://localhost:5000/api/auth/google/callback` |
| CORS errors | Already configured in backend, but ensure ports match |

---

## Next Steps

1. **Test everything above** - Verify Google OAuth and admin creation work
2. **Create test users** - Create lawyer, staff, and client accounts
3. **Frontend Role Guards** - We'll update components to show/hide based on role
4. **Admin Dashboard** - Build admin UI to manage users
5. **Deploy** - Push to production with real Google OAuth credentials

---

## Security Notes

⚠️ **For Production:**
- Change `JWT_SECRET` to a long random string
- Change `SESSION_SECRET` to a long random string
- Use HTTPS (not HTTP)
- Store Client ID and Secret securely (use environment variables)
- Add rate limiting on auth endpoints
- Enable CSRF protection

---

**Questions?** Check the browser console and backend logs for detailed error messages.
