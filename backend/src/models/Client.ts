import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  _id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  type: 'Individual' | 'Corporate' | 'Organization';
  address?: {
    province?: string;
    district?: string;
    city?: string;
    area?: string;
    postalCode?: string;
  };
  createdByUid: string;
  firmId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    displayName: { type: String, required: true },
    email: { type: String },
    phoneNumber: { type: String },
    type: { 
      type: String, 
      enum: ['Individual', 'Corporate', 'Organization'], 
      default: 'Individual' 
    },
    address: {
      province: String,
      district: String,
      city: String,
      area: String,
      postalCode: String,
    },
    createdByUid: { type: String, required: true },
    firmId: { type: String, default: 'default-firm' },
  },
  { timestamps: true }
);

export default mongoose.model<IClient>('Client', clientSchema);
