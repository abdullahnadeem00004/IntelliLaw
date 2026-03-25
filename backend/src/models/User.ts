import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  photoURL?: string;
  googleId?: string;
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
    googleId: {
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
