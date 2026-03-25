import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  expenseNumber: string;
  title: string;
  description?: string;
  amount: number;
  category: 'TRAVEL' | 'OFFICE' | 'UTILITIES' | 'STAFF' | 'LEGAL' | 'OTHER';
  date: Date;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  createdByUid: string;
  approvedByUid?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    expenseNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    category: { 
      type: String, 
      enum: ['TRAVEL', 'OFFICE', 'UTILITIES', 'STAFF', 'LEGAL', 'OTHER'], 
      default: 'OTHER' 
    },
    date: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['PENDING', 'APPROVED', 'PAID'], 
      default: 'PENDING' 
    },
    createdByUid: { type: String, required: true },
    approvedByUid: { type: String },
  },
  { timestamps: true }
);

// Index for faster queries
expenseSchema.index({ date: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdByUid: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
