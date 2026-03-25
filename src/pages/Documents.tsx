import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { LegalDocument } from '../types';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Folder, 
  File,
  ChevronRight,
  Upload,
  Eye,
  AlertCircle,
  Loader2,
  X,
  Check
} from 'lucide-react';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [docStats, setDocStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);

  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    caseId: '',
    category: 'OTHER',
    confidentiality: 'CONFIDENTIAL',
    tags: '',
  });

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
    fetchDocumentStats();
  }, [user, activeCategory]);

  // Fetch documents from backend
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const categoryParam = activeCategory === 'All' ? '' : `&category=${activeCategory}`;
      
      const response = await fetch(
        `http://localhost:5000/api/documents?${searchQuery ? `search=${searchQuery}` : ''}${categoryParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setErrorMessage('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch document statistics
  const fetchDocumentStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/documents/stats/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDocStats(data);
      }
    } catch (error) {
      console.error('Error fetching document stats:', error);
    }
  };

  // Fetch all cases for the dropdown
  const fetchCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cases', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  // Handle file upload
  const handleUploadDocument = async () => {
    if (!uploadingFile) {
      setErrorMessage('Please select a file');
      return;
    }

    if (!uploadFormData.name || !uploadFormData.caseId) {
      setErrorMessage('Missing required fields: name, caseId');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadingFile);
      formData.append('name', uploadFormData.name);
      formData.append('description', uploadFormData.description);
      formData.append('caseId', uploadFormData.caseId);
      formData.append('category', uploadFormData.category);
      formData.append('confidentiality', uploadFormData.confidentiality);
      formData.append('tags', uploadFormData.tags);

      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage('Document uploaded successfully');
        setShowUploadModal(false);
        setUploadingFile(null);
        setShowCaseDropdown(false);
        setCaseSearchQuery('');
        setUploadFormData({
          name: '',
          description: '',
          caseId: '',
          category: 'OTHER',
          confidentiality: 'CONFIDENTIAL',
          tags: '',
        });
        await fetchDocuments();
        await fetchDocumentStats();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error uploading document');
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Document deleted successfully');
        await fetchDocuments();
        await fetchDocumentStats();
      } else {
        setErrorMessage('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setErrorMessage('Error deleting document');
    }
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading documents...</p>
      </div>
    );
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (doc.caseId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || doc.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Document Management</h1>
          <p className="text-neutral-500 text-sm mt-1">Securely store and organize all legal documentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('Folder creation coming soon!')}
            className="btn btn-secondary">
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Stats/Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', value: (docStats?.totalDocuments || 0).toString(), icon: File, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Confidential', value: (docStats?.confidentialCount || 0).toString(), icon: Folder, color: 'text-error', bg: 'bg-error/10' },
          { label: 'Restricted', value: (docStats?.restrictedCount || 0).toString(), icon: Upload, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Public', value: (docStats?.publicCount || 0).toString(), icon: AlertCircle, color: 'text-success', bg: 'bg-success/10' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase">{stat.label}</p>
              <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Categories</h3>
            <div className="space-y-1">
              {['All', 'PLEADINGS', 'EVIDENCE', 'ORDERS', 'CORRESPONDENCE', 'OTHER'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat 
                      ? "bg-primary-600 text-white" 
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className={`w-4 h-4 ${activeCategory === cat ? "text-white" : "text-neutral-400"}`} />
                    {cat === 'All' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activeCategory === cat ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {cat === 'All' ? documents.length : documents.filter(d => d.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI OCR Widget */}
          <div className="p-5 bg-neutral-900 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI OCR Engine</span>
              </div>
              <p className="text-xs font-medium leading-relaxed opacity-90">
                Instantly extract text and key legal entities from scanned documents.
              </p>
              <button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10">
                Try OCR Preview
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-600 rounded-full blur-3xl opacity-20"></div>
          </div>
        </div>

        {/* Document List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search documents by name or case ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10" 
              />
            </div>
            <button className="btn btn-secondary p-2">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Case ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredDocs.map((doc) => (
                    <tr key={doc._id || doc.id} className="hover:bg-neutral-50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 group-hover:bg-white transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 truncate max-w-[200px]">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${doc.isVerified ? 'bg-success' : 'bg-warning'}`}></span>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">{doc.isVerified ? 'Verified' : 'Pending'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-neutral-700 truncate max-w-[150px]">{doc.caseId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 uppercase">
                          {doc.category?.charAt(0) + doc.category?.slice(1).toLowerCase() || 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-neutral-500">{formatFileSize(doc.fileSize || 0)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-neutral-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="View">
                            <Eye className="w-4 h-4" />
                          </a>
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Download">
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleDeleteDocument(doc._id || doc.id || '')}
                            className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                        No documents found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-neutral-900">Upload Document</h2>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingFile(null);
                  setShowCaseDropdown(false);
                  setCaseSearchQuery('');
                }}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-all">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* File Upload Area */}
              <div 
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    setUploadingFile(e.dataTransfer.files[0]);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  isDragging 
                    ? 'border-primary-600 bg-primary-50' 
                    : 'border-neutral-200 hover:border-primary-400'
                }`}>
                <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-primary-600' : 'text-neutral-400'}`} />
                <p className="text-sm font-medium text-neutral-900">
                  {uploadingFile ? uploadingFile.name : 'Drag and drop your file here'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {uploadingFile ? `${formatFileSize(uploadingFile.size)}` : 'or click below to browse'}
                </p>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && setUploadingFile(e.target.files[0])}
                  className="mt-3 w-full"
                  accept="*/*"
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Document Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Complaint Filing"
                    value={uploadFormData.name}
                    onChange={(e) => setUploadFormData({...uploadFormData, name: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Case ID *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCaseDropdown(!showCaseDropdown);
                        if (!showCaseDropdown) {
                          fetchCases();
                        }
                      }}
                      className="input-field w-full text-left flex items-center justify-between">
                      <span>{uploadFormData.caseId || 'Select a case...'}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showCaseDropdown ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showCaseDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                        <div className="p-2 border-b border-neutral-200 sticky top-0">
                          <div className="relative flex items-center">
                            <Search className="absolute left-2.5 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              placeholder="Search cases..."
                              value={caseSearchQuery}
                              onChange={(e) => setCaseSearchQuery(e.target.value)}
                              className="pl-8 pr-3 py-2 w-full text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {cases
                            .filter((c) => 
                              c._id?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                              c.caseNumber?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                              c.title?.toLowerCase().includes(caseSearchQuery.toLowerCase())
                            )
                            .map((caseItem) => (
                              <button
                                key={caseItem._id}
                                type="button"
                                onClick={() => {
                                  setUploadFormData({...uploadFormData, caseId: caseItem._id});
                                  setShowCaseDropdown(false);
                                  setCaseSearchQuery('');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors flex flex-col gap-0.5 border-b border-neutral-100 last:border-b-0">
                                <p className="text-sm font-medium text-neutral-900">{caseItem._id}</p>
                                <p className="text-xs text-neutral-500">{caseItem.title}</p>
                              </button>
                            ))}
                          {cases.filter((c) => 
                            c._id?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                            c.caseNumber?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                            c.title?.toLowerCase().includes(caseSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-neutral-500">
                              No cases found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select
                    value={uploadFormData.category}
                    onChange={(e) => setUploadFormData({...uploadFormData, category: e.target.value})}
                    className="input-field">
                    <option value="OTHER">Other</option>
                    <option value="PLEADINGS">Pleadings</option>
                    <option value="EVIDENCE">Evidence</option>
                    <option value="ORDERS">Orders</option>
                    <option value="CORRESPONDENCE">Correspondence</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Confidentiality</label>
                  <select
                    value={uploadFormData.confidentiality}
                    onChange={(e) => setUploadFormData({...uploadFormData, confidentiality: e.target.value})}
                    className="input-field">
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea
                    placeholder="Enter document description..."
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData({...uploadFormData, description: e.target.value})}
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 block">Tags</label>
                  <input
                    type="text"
                    placeholder="Comma separated tags"
                    value={uploadFormData.tags}
                    onChange={(e) => setUploadFormData({...uploadFormData, tags: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadingFile(null);
                    setShowCaseDropdown(false);
                    setCaseSearchQuery('');
                    setUploadFormData({
                      name: '',
                      description: '',
                      caseId: '',
                      category: 'OTHER',
                      confidentiality: 'CONFIDENTIAL',
                      tags: '',
                    });
                  }}
                  className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleUploadDocument}
                  className="btn btn-primary flex-1">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
