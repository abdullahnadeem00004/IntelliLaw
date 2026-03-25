import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface FirmProfile {
  firmName: string;
  firmLicense: string;
  country: string;
  city: string;
  address: string;
  phoneNumber: string;
  website?: string;
  numberOfLawyers?: number;
  specialization?: string;
}

export interface LawyerProfile {
  fullName: string;
  licenseNumber: string;
  specialization: string;
  yearsOfExperience: number;
  barCouncil: string;
  phoneNumber: string;
  address?: string;
  firmName?: string;
}

export interface ClientProfile {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  cnic?: string;
  companyName?: string;
  isIndividual: boolean;
}

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  photoURL?: string;
  googleId?: string;
  role: 'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF';
  userType: 'FIRM' | 'LAWYER' | 'CLIENT';
  firmProfile?: FirmProfile;
  lawyerProfile?: LawyerProfile;
  clientProfile?: ClientProfile;
  isProfileComplete: boolean;
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
    userType: {
      type: String,
      enum: ['FIRM', 'LAWYER', 'CLIENT'],
      default: 'CLIENT',
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    firmProfile: {
      firmName: String,
      firmLicense: String,
      country: String,
      city: String,
      address: String,
      phoneNumber: String,
      website: String,
      numberOfLawyers: Number,
      specialization: String,
    },
    lawyerProfile: {
      fullName: String,
      licenseNumber: String,
      specialization: String,
      yearsOfExperience: Number,
      barCouncil: String,
      phoneNumber: String,
      address: String,
      firmName: String,
    },
    clientProfile: {
      fullName: String,
      phoneNumber: String,
      address: String,
      city: String,
      cnic: String,
      companyName: String,
      isIndividual: Boolean,
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
