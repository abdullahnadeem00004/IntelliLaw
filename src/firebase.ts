// ⚠️ DEPRECATED: This file is kept for backward compatibility during migration
// All functionality has been moved to:
// - src/services/authService.ts (Authentication)
// - src/components/FirebaseProvider.tsx (Auth Context)
// 
// Please import from the files above instead.

export const logout = async () => {
  throw new Error('Firebase has been removed. Use authAPI.logout() from authService instead.');
};

export const signInWithGoogle = async () => {
  throw new Error('Firebase has been removed. Use MongoDB authentication from authService instead.');
};

export const db = null;
export const auth = null;
export const googleProvider = null;
export const handleFirestoreError = () => {
  throw new Error('Firebase has been removed. Use MongoDB error handling instead.');
};
export const OperationType = {};
export const Timestamp = null;

