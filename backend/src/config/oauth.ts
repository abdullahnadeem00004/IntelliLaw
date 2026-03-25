import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

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
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (!user) {
            // Create new user from Google profile
            user = new User({
              email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
              displayName: profile.displayName || profile.name?.givenName || 'User',
              photoURL: profile.photos?.[0]?.value,
              password: 'oauth_user', // OAuth users don't have passwords
              role: 'CLIENT', // Default role for new users
              googleId: profile.id,
            });
            await user.save();
          }

          // Generate JWT token
          const token = generateToken(user._id.toString(), user.email);

          done(null, { user, token });
        } catch (error) {
          done(error, undefined);
        }
      }
    )
  );

  passport.serializeUser((data: any, done) => {
    done(null, data);
  });

  passport.deserializeUser((data: any, done) => {
    done(null, data);
  });
}

export default setupGoogleOAuth;
