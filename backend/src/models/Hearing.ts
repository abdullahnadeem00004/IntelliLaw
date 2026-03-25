import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHearing extends Document {
  caseId: string;
  caseTitle: string;
  date: Date;
  time: string;
  court: string;
  purpose: string;
  status: 'UPCOMING' | 'COMPLETED' | 'ADJOURNED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const HearingSchema = new Schema<IHearing>(
  {
    caseId: {
      type: String,
      required: true,
      index: true,
    },
    caseTitle: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    court: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'COMPLETED', 'ADJOURNED', 'CANCELLED'],
      default: 'UPCOMING',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    notes: String,
    createdBy: {
      type: String,
      required: true,
    },
  },
  { 
    timestamps: true,
    collection: 'hearings'
  }
);

// Index for efficient queries
HearingSchema.index({ caseId: 1, date: 1 });
HearingSchema.index({ status: 1, date: 1 });
HearingSchema.index({ createdBy: 1, date: 1 });

const Hearing = mongoose.model<IHearing>('Hearing', HearingSchema);

export default Hearing;
