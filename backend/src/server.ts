import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import clientRoutes from './routes/clients.js';
import taskRoutes from './routes/tasks.js';
import billingRoutes from './routes/billing.js';
import expenseRoutes from './routes/expenses.js';
import documentRoutes from './routes/documents.js';
import hearingRoutes from './routes/hearings.js';
import dashboardRoutes from './routes/dashboard.js';
import setupGoogleOAuth from './config/oauth.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellilaw';

// Setup Google OAuth
setupGoogleOAuth();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.7.130:3000', 'http://192.168.7.130:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/hearings', hearingRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
