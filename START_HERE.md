# 🚀 START HERE - Your Step-by-Step Implementation Guide

**Created:** March 25, 2026  
**Status:** Firebase Removed ✅ | MongoDB Ready ✅ | Backend Template Ready ✅

---

## 📦 What You Have Now

Your IntelliLaw frontend is completely Firebase-free and ready to work with MongoDB through a REST API backend.

### ✅ Already Done for You:
1. Firebase completely removed
2. MongoDB authentication service created
3. API-based case service created
4. Login page updated with email/password
5. Database configuration set up
6. Environment variables configured
7. All dependencies updated
8. TypeScript types defined

### 🔄 You Need to Do:
1. Install MongoDB (10-15 minutes)
2. Create the backend server (30 minutes with our template)
3. Run the three services (2 minutes)
4. Test and verify (5 minutes)

---

## ⏱️ Total Time: ~1 Hour

---

## STEP-BY-STEP IMPLEMENTATION

### STEP 1: Install MongoDB (15 minutes)

Choose ONE option:

#### Option A: macOS (Homebrew)
```bash
brew install mongodb-community
brew services start mongodb-community

# Verify
mongosh "mongodb://localhost:27017"
# Should show: test>
```

#### Option B: Ubuntu/Linux (Apt)
```bash
sudo apt-get update
sudo apt-get install mongodb-org

sudo systemctl start mongod

# Verify
mongosh "mongodb://localhost:27017"
# Should show: test>
```

#### Option C: Windows
1. Go to: https://www.mongodb.com/try/download/community
2. Download Community Server
3. Run installer
4. Choose "Install as a Service"
5. MongoDB starts automatically

#### Option D: Docker (Easiest Alternative)
```bash
# Install Docker first if needed: https://docker.com

docker run -d \
  -p 27017:27017 \
  --name intellilaw-mongodb \
  mongo:latest

# Verify
# Docker runs in background, check with:
docker ps
```

**✅ Verify MongoDB is running:**
```bash
mongosh "mongodb://localhost:27017"
```
You should see a prompt. Type `exit` to quit.

---

### STEP 2: Create Backend Folder Structure (5 minutes)

```bash
cd /home/abdullah/Desktop/IntelliLaw

# Create folders
mkdir -p backend/src/{models,routes,middleware}

# Result should be:
# backend/
# ├── src/
# │   ├── models/
# │   ├── routes/
# │   ├── middleware/
# │   └── server.ts (create next)
# ├── package.json (create next)
# └── tsconfig.json (create next)
```

---

### STEP 3: Create Backend Configuration Files

#### File 1: `backend/package.json`

Create file: `/home/abdullah/Desktop/IntelliLaw/backend/package.json`

```json
{
  "name": "intellilaw-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jwt-simple": "^0.5.6",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "typescript": "~5.8.2",
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@types/bcryptjs": "^2.4.8",
    "tsx": "^4.21.0"
  }
}
```

#### File 2: `backend/tsconfig.json`

Create file: `/home/abdullah/Desktop/IntelliLaw/backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

#### File 3: `backend/.env`

Create file: `/home/abdullah/Desktop/IntelliLaw/backend/.env`

```env
MONGODB_URI=mongodb://localhost:27017/intellilaw
NODE_ENV=development
PORT=5000
JWT_SECRET=change_this_in_production_to_a_long_random_string
```

---

### STEP 4: Create Database Models

#### File 4: `backend/src/models/User.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  photoURL?: string;
  role: 'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
      default: undefined,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'LAWYER', 'CLIENT', 'STAFF'],
      default: 'CLIENT',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Unknown error'));
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcryptjs.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
```

#### File 5: `backend/src/models/Case.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ICase extends Document {
  title: string;
  caseNumber: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  court: string;
  judge?: string;
  status: 'ACTIVE' | 'CLOSED' | 'PENDING' | 'ON_HOLD';
  clientName: string;
  clientId?: string;
  assignedLawyerUid: string;
  assignedLawyerName: string;
  nextHearingDate?: Date;
  lastActivityDate: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const caseSchema = new Schema<ICase>(
  {
    title: { type: String, required: true },
    caseNumber: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    description: { type: String, default: '' },
    court: { type: String, required: true },
    judge: { type: String },
    status: { type: String, enum: ['ACTIVE', 'CLOSED', 'PENDING', 'ON_HOLD'], default: 'ACTIVE' },
    clientName: { type: String, required: true },
    clientId: { type: String },
    assignedLawyerUid: { type: String, required: true },
    assignedLawyerName: { type: String, required: true },
    nextHearingDate: { type: Date },
    lastActivityDate: { type: Date, default: Date.now },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model<ICase>('Case', caseSchema);
```

---

### STEP 5: Create Authentication Middleware

#### File 6: `backend/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jwt-simple';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.decode(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const generateToken = (userId: string, email: string) => {
  return jwt.encode(
    {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    },
    JWT_SECRET
  );
};
```

---

### STEP 6: Create API Routes

#### File 7: `backend/src/routes/auth.ts`

```typescript
import { Router, Response } from 'express';
import User from '../models/User.js';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, displayName, role: 'CLIENT' });
    await user.save();

    const token = generateToken(user._id.toString(), user.email);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Sign up failed', error });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString(), user.email);

    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({
      uid: user?._id,
      email: user?.email,
      displayName: user?.displayName,
      photoURL: user?.photoURL,
      role: user?.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
});

export default router;
```

#### File 8: `backend/src/routes/cases.ts`

```typescript
import { Router } from 'express';
import Case from '../models/Case.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cases', error });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch case', error });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const caseData = new Case(req.body);
    await caseData.save();
    res.status(201).json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create case', error });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const caseData = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update case', error });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Case.findByIdAndDelete(req.params.id);
    res.json({ message: 'Case deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete case', error });
  }
});

export default router;
```

---

### STEP 7: Create Main Server File

#### File 9: `backend/src/server.ts`

```typescript
import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellilaw';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});
```

---

### STEP 8: Install Backend Dependencies (5 minutes)

```bash
cd /home/abdullah/Desktop/IntelliLaw/backend
npm install

# Wait for installation to complete...
# Should show: added XX packages
```

---

### STEP 9: Run Everything! (2 minutes)

Open THREE terminal windows:

**Terminal 1: MongoDB**
```bash
mongod
# OR if using Docker:
# docker start intellilaw-mongodb
```

**Terminal 2: Backend Server**
```bash
cd /home/abdullah/Desktop/IntelliLaw/backend
npm run dev

# You should see:
# ✅ Connected to MongoDB
# ✅ Backend server running on http://localhost:5000
```

**Terminal 3: Frontend React App**
```bash
cd /home/abdullah/Desktop/IntelliLaw
npm run dev

# You should see:
# VITE ...
# ➜  Local:   http://localhost:3000
```

---

### STEP 10: Test Your System (5 minutes)

**Test 1: Check Backend is Running**
```bash
# In any terminal:
curl http://localhost:5000/api/health

# Response:
# {"status":"OK","message":"Backend is running"}
```

**Test 2: Sign Up**
1. Open http://localhost:3000
2. Click "Sign Up"
3. Enter:
   - Full Name: John Doe
   - Email: john@example.com
   - Password: Password123
4. Click "Create Account"
5. Should redirect to dashboard

**Test 3: Login**
1. Log out (button in sidebar)
2. Login with same email and password
3. Should see dashboard again

**Test 4: Create a Case**
1. Click "Cases" in sidebar
2. Click "New Case"
3. Fill in form:
   - Title: Sample Case
   - Case Number: 2024-001
   - Category: Civil
   - Court: District Court
   - etc.
4. Click "Create"
5. Case should appear in cases list

---

## ✅ Success Indicators

When everything works:
- ✅ http://localhost:3000 loads (React frontend)
- ✅ http://localhost:5000/api/health returns OK
- ✅ Can sign up with email/password
- ✅ Can login after signup
- ✅ Can see dashboard after login
- ✅ Can create cases
- ✅ No Firebase errors in console
- ✅ No CORS errors

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot GET /api/health" | Backend not running - do `npm run dev` in terminal 2 |
| "Cannot connect to localhost:3000" | Frontend not running - do `npm run dev` in terminal 3 |
| "MongoDB connection failed" | MongoDB not running - do `mongod` in terminal 1 |
| "Port 5000 in use" | Change PORT in backend/.env or kill: `lsof -i :5000` |
| "CORS error" | Backend CORS already configured, restart both servers |
| "Login not working" | Check browser console for errors, verify backend running |
| "Cannot find module 'express'" | Run `npm install` in backend folder |

---

## 🎉 You're Done!

Your IntelliLaw application is now running with:
- ✅ MongoDB database
- ✅ Express backend API
- ✅ React frontend
- ✅ JWT authentication
- ✅ Password hashing with bcryptjs
- ✅ Type-safe TypeScript code

---

## 📚 Next Steps (After It's Working)

1. **Test the database**: View data in MongoDB
   ```bash
   mongosh
   > use intellilaw
   > db.users.find()
   > db.cases.find()
   ```

2. **Add more models**: Follow the User & Case pattern for Clients, Teams, Documents, etc.

3. **Add more routes**: Create routes for remaining features

4. **Update frontend pages**: Make remaining pages call new APIs

5. **Add real-time updates**: Implement Socket.io for live updates

6. **Deploy**: Prepare for production deployment

---

**Start with Step 1 and follow each step in order. You'll have everything working in about 1 hour!**

Good luck! 🚀
