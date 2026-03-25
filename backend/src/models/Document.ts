import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  documentNumber: string;
  name: string;
  description?: string;
  caseId: string;
  category: 'PLEADINGS' | 'EVIDENCE' | 'ORDERS' | 'CORRESPONDENCE' | 'OTHER';
  fileUrl: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // MIME type
  uploadedBy: string; // uid
  uploadedAt: Date;
  tags?: string[];
  isVerified?: boolean;
  confidentiality?: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL';
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    caseId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['PLEADINGS', 'EVIDENCE', 'ORDERS', 'CORRESPONDENCE', 'OTHER'],
      default: 'OTHER',
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: String,
      required: true,
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    tags: [String],
    isVerified: {
      type: Boolean,
      default: true,
    },
    confidentiality: {
      type: String,
      enum: ['PUBLIC', 'RESTRICTED', 'CONFIDENTIAL'],
      default: 'CONFIDENTIAL',
    },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ caseId: 1, category: 1 });
DocumentSchema.index({ uploadedAt: -1 });
DocumentSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IDocument>('Document', DocumentSchema);
