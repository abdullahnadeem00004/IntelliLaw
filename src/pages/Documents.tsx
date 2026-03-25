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
  Loader2
} from 'lucide-react';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    // Documents fetching will be implemented when backend service is ready
    setDocuments([]);
    setLoading(false);
  }, [user]);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.caseId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || doc.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Document Management</h1>
          <p className="text-neutral-500 text-sm mt-1">Securely store and organize all legal documentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </button>
          <button className="btn btn-primary">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Stats/Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', value: documents.length.toString(), icon: File, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Storage Used', value: '1.2 GB', icon: Folder, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Recent Uploads', value: documents.filter(d => new Date(d.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length.toString(), icon: Upload, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Pending Review', value: '0', icon: AlertCircle, color: 'text-error', bg: 'bg-error/10' },
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
              {['All', 'Pleadings', 'Evidence', 'Orders', 'Correspondence', 'Other'].map((cat) => (
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
                    {cat}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activeCategory === cat ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {cat === 'All' ? documents.length : documents.filter(d => d.category.toLowerCase() === cat.toLowerCase()).length}
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
                    <tr key={doc.id} className="hover:bg-neutral-50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 group-hover:bg-white transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 truncate max-w-[200px]">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full bg-success`}></span>
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Verified</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-neutral-700 truncate max-w-[150px]">{doc.caseId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 uppercase">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-neutral-500">{doc.size}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-neutral-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-all">
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
    </div>
  );
}
