# MongoDB Migration Guide for IntelliLaw

## Overview
You've successfully removed Firebase from your IntelliLaw project. Now we'll set up MongoDB and create a backend server to handle authentication and data management.

---

## PART 1: MongoDB Installation & Setup

### Option 1: Install MongoDB Locally (Recommended for Development)

#### For Windows:
1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer and follow setup wizard
3. MongoDB will install as a Windows service
4. Default connection string: `mongodb://localhost:27017`

#### For macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### For Linux (Ubuntu/Debian):
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

### Option 2: Use Docker (Easier)
```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d -p 27017:27017 --name intellilaw-mongodb mongo:latest
```

### Verify MongoDB is Running:
```bash
# If installed locally, test connection:
mongosh "mongodb://localhost:27017"

# You should see the MongoDB shell prompt
```

---

## PART 2: Backend API Setup

### Step 1: Create Backend Directory
```bash
cd /home/abdullah/Desktop/IntelliLaw
mkdir -p backend/src/{models,routes,middleware}
touch backend/server.ts
touch backend/package.json
```

### Step 2: Create Backend Package.json
Create `/home/abdullah/Desktop/IntelliLaw/backend/package.json`:

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
    "dotenv": "^17.2.3",
    "axios": "^1.6.2"
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

### Step 3: Create Backend TypeScript Config
Create `/home/abdullah/Desktop/IntelliLaw/backend/tsconfig.json`:

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

### Step 4: Create MongoDB Models

Create `/home/abdullah/Desktop/IntelliLaw/backend/src/models/User.ts`:

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

Create `/home/abdullah/Desktop/IntelliLaw/backend/src/models/Case.ts`:

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
    title: {
      type: String,
      required: true,
    },
    caseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    description: {
      type: String,
      default: '',
    },
    court: {
      type: String,
      required: true,
    },
    judge: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED', 'PENDING', 'ON_HOLD'],
      default: 'ACTIVE',
    },
    clientName: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
    },
    assignedLawyerUid: {
      type: String,
      required: true,
    },
    assignedLawyerName: {
      type: String,
      required: true,
    },
    nextHearingDate: {
      type: Date,
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model<ICase>('Case', caseSchema);
```

### Step 5: Create Authentication Middleware

Create `/home/abdullah/Desktop/IntelliLaw/backend/src/middleware/auth.ts`:

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

### Step 6: Create API Routes

Create `/home/alfonso/Desktop/IntelliLaw/backend/src/routes/auth.ts`:

```typescript
import { Router, Response } from 'express';
import User, { IUser } from '../models/User.js';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName,
      role: 'CLIENT',
    });

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

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
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

// Get current user
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

Create `/home/abdullah/Desktop/IntelliLaw/backend/src/routes/cases.ts`:

```typescript
import { Router } from 'express';
import Case from '../models/Case.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all cases
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cases', error });
  }
});

// Get single case
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch case', error });
  }
});

// Create case
router.post('/', authMiddleware, async (req, res) => {
  try {
    const caseData = new Case(req.body);
    await caseData.save();
    res.status(201).json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create case', error });
  }
});

// Update case
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const caseData = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update case', error });
  }
});

// Delete case
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

### Step 7: Create Main Server File

Create `/home/abdullah/Desktop/IntelliLaw/backend/src/server.ts`:

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

### Step 8: Install Backend Dependencies
```bash
cd /home/abdullah/Desktop/IntelliLaw/backend
npm install
```

---

## PART 3: Running Everything

### Terminal 1: MongoDB (if not using Docker)
```bash
# On Linux/macOS
mongod

# On Windows (if installed via installer):
# MongoDB runs as a service automatically
```

### Terminal 2: Backend API
```bash
cd /home/abdullah/Desktop/IntelliLaw/backend
npm run dev
```

You should see:
```
✅ Connected to MongoDB
✅ Backend server running on http://localhost:5000
```

### Terminal 3: Frontend
```bash
cd /home/abdullah/Desktop/IntelliLaw
npm run dev
```

---

## PART 4: Testing

### Test Login Signup:
1. Navigate to http://localhost:3000/login
2. Click "Sign Up"
3. Enter email, password, name
4. Create account
5. You should be logged in and redirected to dashboard

### Test Backend Endpoint:
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{"status":"OK","message":"Backend is running"}
```

---

## PART 5: Database Visualization

### Using MongoDB Compass (GUI):
1. Download: https://www.mongodb.com/products/compass
2. Connect to `mongodb://localhost:27017`
3. View databases and collections in real-time

### Using Mongosh (CLI):
```bash
# Connect
mongosh

# View databases
show databases

# Switch to intellilaw
use intellilaw

# View collections
show collections

# View users
db.users.find()

# View cases
db.cases.find()
```

---

## Troubleshooting

### MongoDB Connection Issues:
```bash
# Check if MongoDB is running
mongosh "mongodb://localhost:27017"

# If connection refused:
# 1. Restart MongoDB service
sudo systemctl restart mongod  # Linux
brew services restart mongodb-community  # macOS
```

### Backend Port Already in Use:
```bash
# Change PORT in .env file or use:
lsof -i :5000  # Find process
kill -9 <PID>  # Kill process
```

### CORS Issues:
Already configured in backend (see cors middleware in server.ts)

---

## Next Steps

After getting MongoDB working:
1. Add more models (Team, Clients, Documents, etc.) following the pattern in User.ts and Case.ts
2. Create routes for all features (Teams, Clients, Hearings, etc.)
3. Implement real-time updates using Socket.io (if needed)
4. Add file upload support (for documents)
5. Set up environment variables for production
6. Deploy to production (Heroku, Railway, DigitalOcean, etc.)

---

Good luck! 🚀
