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
