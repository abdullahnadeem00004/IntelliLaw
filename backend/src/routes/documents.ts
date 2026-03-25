import { Router } from 'express';
import Document from '../models/Document.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = Router();

// Helper function to construct full file URL
const getFullFileUrl = (fileUrl: string, req: any): string => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const protocol = req.secure ? 'https' : 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}${fileUrl}`;
};

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${name}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Get all documents with filtering
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { caseId, category, search, tags } = req.query;
      const query: any = {};

      if (caseId) query.caseId = caseId;
      if (category && category !== 'All') {
        query.category = (category as string).toUpperCase();
      }

      if (search) {
        query.$text = { $search: search as string };
      }

      if (tags) {
        const tagArray = typeof tags === 'string' ? [tags] : tags;
        query.tags = { $in: tagArray };
      }

      const documents = await Document.find(query)
        .sort({ uploadedAt: -1 })
        .limit(500);

      // Normalize fileUrl for all documents
      const docsWithFullUrls = documents.map(doc => ({
        ...doc.toObject(),
        fileUrl: getFullFileUrl(doc.fileUrl, req)
      }));

      res.json(docsWithFullUrls);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents', error });
    }
  }
);

// Get document by ID
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      const docWithFullUrl = {
        ...document.toObject(),
        fileUrl: getFullFileUrl(document.fileUrl, req)
      };
      res.json(docWithFullUrl);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch document', error });
    }
  }
);

// Create new document (with file upload)
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const { name, description, caseId, category, tags, confidentiality } = req.body;

      if (!name || !caseId) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          message: 'Missing required fields: name, caseId',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      // Generate document number
      const documentNumber = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create file path for serving with full URL
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host') || 'localhost:5000';
      const fileUrl = `${protocol}://${host}/uploads/documents/${req.file.filename}`;

      const newDocument = new Document({
        documentNumber,
        name,
        description,
        caseId,
        category: (category || 'OTHER').toUpperCase(),
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        uploadedBy: req.user?.uid || 'unknown',
        tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
        confidentiality: (confidentiality || 'CONFIDENTIAL').toUpperCase(),
      });

      await newDocument.save();
      res.status(201).json(newDocument);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('Error deleting uploaded file:', e);
        }
      }
      console.error('Document creation error:', error);
      res.status(500).json({
        message: 'Failed to create document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Update document
router.put(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { name, description, category, tags, confidentiality, isVerified } = req.body;

      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (name) document.name = name;
      if (description !== undefined) document.description = description;
      if (category) document.category = category.toUpperCase();
      if (tags) document.tags = tags;
      if (confidentiality) document.confidentiality = confidentiality;
      if (isVerified !== undefined) document.isVerified = isVerified;

      await document.save();
      res.json(document);
    } catch (error) {
      console.error('Document update error:', error);
      res.status(500).json({
        message: 'Failed to update document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Delete document
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const document = await Document.findByIdAndDelete(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // In production, also delete from cloud storage
      // For now, just delete from database
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get document statistics
router.get(
  '/stats/summary',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const totalDocuments = await Document.countDocuments();
      const byCategory = await Document.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
          },
        },
      ]);

      const recentDocuments = await Document.find()
        .sort({ uploadedAt: -1 })
        .limit(10);

      const confidentialCount = await Document.countDocuments({ confidentiality: 'CONFIDENTIAL' });
      const restrictedCount = await Document.countDocuments({ confidentiality: 'RESTRICTED' });
      const publicCount = await Document.countDocuments({ confidentiality: 'PUBLIC' });

      // Normalize fileUrl for recent documents
      const recentDocsWithFullUrls = recentDocuments.map(doc => ({
        ...doc.toObject(),
        fileUrl: getFullFileUrl(doc.fileUrl, req)
      }));

      res.json({
        totalDocuments,
        recentDocuments: recentDocsWithFullUrls,
        byCategory,
        confidentialCount,
        restrictedCount,
        publicCount,
      });
    } catch (error) {
      console.error('Document stats error:', error);
      res.status(500).json({ message: 'Failed to fetch document statistics', error });
    }
  }
);

export default router;
