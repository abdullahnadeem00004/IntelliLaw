import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem extends Document {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  caseId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL';
  dueDate: Date;
  issuedDate: Date;
  items: IInvoiceItem[];
  notes?: string;
  amountPaid?: number;
  createdByUid: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    caseId: { type: String, required: true },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['PAID', 'UNPAID', 'OVERDUE', 'PARTIAL'], 
      default: 'UNPAID' 
    },
    dueDate: { type: Date, required: true },
    issuedDate: { type: Date, default: Date.now },
    items: [invoiceItemSchema],
    notes: { type: String },
    amountPaid: { type: Number, default: 0 },
    createdByUid: { type: String, required: true },
  },
  { timestamps: true }
);

// Index for faster queries
invoiceSchema.index({ caseId: 1 });
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdByUid: 1 });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
