import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  _id: string;
  title: string;
  description?: string;
  caseId?: string;
  dueDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: string;
  assignedToName?: string;
  createdByUid: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    caseId: { type: String },
    dueDate: { type: Date, required: true },
    priority: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH'], 
      default: 'MEDIUM' 
    },
    status: { 
      type: String, 
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'], 
      default: 'TODO' 
    },
    assignedTo: { type: String, required: true },
    assignedToName: { type: String },
    createdByUid: { type: String, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', taskSchema);
