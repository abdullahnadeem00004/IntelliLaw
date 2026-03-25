import React, { useState } from 'react';
import { 
  Book, 
  Search, 
  ChevronRight, 
  FileText, 
  Scale, 
  Gavel, 
  HelpCircle, 
  ExternalLink, 
  Bookmark,
  Zap,
  Filter,
  ArrowRight
} from 'lucide-react';

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { title: 'Legal Guides', icon: Book, count: 24, color: 'text-primary-600', bg: 'bg-primary-50' },
    { title: 'Templates', icon: FileText, count: 15, color: 'text-success', bg: 'bg-success/10' },
    { title: 'Case Precedents', icon: Scale, count: 120, color: 'text-warning', bg: 'bg-warning/10' },
    { title: 'Court Procedures', icon: Gavel, count: 8, color: 'text-error', bg: 'bg-error/10' },
  ];

  const articles = [
    {
      title: 'How to File a Writ Petition in Lahore High Court',
      category: 'Legal Guides',
      readTime: '8 min read',
      summary: 'A comprehensive step-by-step guide on the procedural requirements for filing a writ petition under Article 199.'
    },
    {
      title: 'Standard Employment Contract Template (Pakistan)',
      category: 'Templates',
      readTime: '5 min read',
      summary: 'A legally compliant employment contract template covering all essential clauses under Pakistani labor laws.'
    },
    {
      title: 'Understanding the Right to Information Act 2013',
      category: 'Legal Guides',
      readTime: '12 min read',
      summary: 'An in-depth analysis of the RTI Act and how citizens can exercise their right to access public information.'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="card p-12 bg-primary-900 text-white relative overflow-hidden text-center">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">How can we help you today?</h1>
          <p className="text-primary-200 mb-8">Search our extensive knowledge base for legal guides, templates, and FAQs.</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for guides, templates, or legal terms..." 
              className="w-full bg-white border-none rounded-2xl pl-14 pr-4 py-5 text-neutral-900 text-lg shadow-2xl outline-none focus:ring-4 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-800 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary-800 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, i) => (
          <div key={i} className="card p-6 hover:border-primary-300 transition-all cursor-pointer group">
            <div className={`w-12 h-12 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <cat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">{cat.title}</h3>
            <p className="text-sm text-neutral-500 mt-1">{cat.count} Articles</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured Articles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-neutral-900">Featured Articles</h2>
            <button className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {articles.map((article, i) => (
            <div key={i} className="card p-8 hover:border-primary-200 transition-all group cursor-pointer">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {article.category}
                    </span>
                    <span className="text-xs text-neutral-400">{article.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors mb-3">
                    {article.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-neutral-300 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar: AI Assistant & Popular Topics */}
        <div className="space-y-8">
          {/* AI Assistant Promo */}
          <div className="p-8 bg-neutral-900 rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI Legal Assistant</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-8">
                Can't find what you're looking for? Ask our AI assistant for instant legal information and guidance.
              </p>
              <button className="w-full py-3 bg-white text-neutral-900 rounded-xl text-sm font-bold hover:bg-neutral-100 transition-all">
                Start AI Chat
              </button>
            </div>
          </div>

          {/* Popular Topics */}
          <div className="card p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Popular Topics</h3>
            <div className="space-y-4">
              {[
                'Writ Jurisdiction',
                'Property Registration',
                'Labor Rights',
                'Consumer Protection',
                'Cybercrime Laws',
              ].map((topic, i) => (
                <button key={i} className="w-full flex items-center justify-between group text-left">
                  <span className="text-sm text-neutral-600 group-hover:text-primary-600 transition-colors">{topic}</span>
                  <div className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* External Resources */}
          <div className="card p-8">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">External Resources</h3>
            <div className="space-y-4">
              {[
                { name: 'Pakistan Code', url: 'pakistancode.gov.pk' },
                { name: 'Supreme Court Rules', url: 'supremecourt.gov.pk' },
                { name: 'Punjab Laws', url: 'punjablaws.gov.pk' },
              ].map((res, i) => (
                <a key={i} href={`https://${res.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group">
                  <span className="text-sm text-neutral-600 group-hover:text-primary-600 transition-colors">{res.name}</span>
                  <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-primary-600 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
