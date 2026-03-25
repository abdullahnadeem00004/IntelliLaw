import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

// Store role selection temporarily (better: use state parameter)
const roleStore: Map<string, string> = new Map();

export function getRoleAndClear(key: string): string | undefined {
  const role = roleStore.get(key);
  if (role) roleStore.delete(key);
  return role;
}

export function storeRoleForOAuth(key: string, role: string) {
  roleStore.set(key, role);
  // Clear after 10 minutes to prevent memory leaks
  setTimeout(() => roleStore.delete(key), 10 * 60 * 1000);
}

function getUserRoleByType(userType: string) {
  if (userType === 'FIRM' || userType === 'LAWYER') {
    return 'ADMIN';
  }
  return 'CLIENT';
}

export function setupGoogleOAuth() {
  // Read environment variables inside the function to ensure dotenv.config() has been called
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  // Skip setup if Google OAuth credentials are not configured
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not configured. Skipping Google OAuth setup.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: Profile, done: (err: any, user?: any) => void) => {
        try {
          // Check if user exists
          let user = await User.findOne({ email: profile.emails?.[0]?.value });

          // Get the role from request state or default to CLIENT
          let userTypeParam = (req.query?.role || (req.session && (req.session as any).selectedRole) || 'CLIENT') as string;
          if (!['FIRM', 'LAWYER', 'CLIENT'].includes(userTypeParam)) {
            userTypeParam = 'CLIENT';
          }
          const userType = userTypeParam as 'FIRM' | 'LAWYER' | 'CLIENT';

          const userRole = getUserRoleByType(userType);

          if (!user) {
            // Create new user from Google profile
            user = new User({
              email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
              displayName: profile.displayName || profile.name?.givenName || 'User',
              photoURL: profile.photos?.[0]?.value,
              password: 'oauth_user', // OAuth users don't have passwords
              role: userRole,
              userType: userType,
              isProfileComplete: false,
              googleId: profile.id,
            });
            await user.save();
          } else {
            // Update existing user's type if they're signing in with a different role
            if (user.userType !== userType) {
              user.userType = userType;
              user.role = userRole;
              user.isProfileComplete = false;
              await user.save();
            }
          }

          // Generate JWT token
          const token = generateToken(user._id.toString(), user.email, user.role);

          done(null, { user, token });
        } catch (error) {
          done(error, undefined);
        }
      }
    )
  );

  passport.serializeUser((data: any, done: (err: any, id?: any) => void) => {
    done(null, data);
  });

  passport.deserializeUser((data: any, done: (err: any, user?: any) => void) => {
    done(null, data);
  });
}

export default setupGoogleOAuth;
