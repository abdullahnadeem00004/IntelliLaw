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
  clientUid?: string;
  clientEmail?: string;
  assignedLawyerUid: string;
  assignedLawyerName: string;
  createdByUid: string;
  createdByName?: string;
  createdByUserType?: 'FIRM' | 'LAWYER' | 'CLIENT';
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
    clientUid: { type: String, index: true },
    clientEmail: { type: String },
    assignedLawyerUid: { type: String, required: true },
    assignedLawyerName: { type: String, required: true },
    createdByUid: { type: String, required: true, index: true },
    createdByName: { type: String },
    createdByUserType: { type: String, enum: ['FIRM', 'LAWYER', 'CLIENT'] },
    nextHearingDate: { type: Date },
    lastActivityDate: { type: Date, default: Date.now },
    tags: [String],
  },
  { timestamps: true }
);

caseSchema.index({ assignedLawyerUid: 1, createdAt: -1 });
caseSchema.index({ clientUid: 1, createdAt: -1 });
caseSchema.index({ createdByUid: 1, createdAt: -1 });

export default mongoose.model<ICase>('Case', caseSchema);
