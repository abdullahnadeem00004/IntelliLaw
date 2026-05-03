import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Search, 
  BookOpen, 
  Scale, 
  Gavel, 
  FileText, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  ChevronRight,
  Filter,
  Zap,
  History,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import LegalChatbot from '../components/LegalChatbot';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function LegalResearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Research the following legal query in the context of Pakistan law: ${searchQuery}. 
        Provide a list of relevant precedents, statutes, or case laws. 
        Format each result as a JSON object with: title, court, date, summary, tags (array), and relevance (percentage string).
        Return only the JSON array.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        },
      });

      const text = response.text;
      if (text) {
        const parsedResults = JSON.parse(text);
        // Add grounding metadata if available
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const enrichedResults = parsedResults.map((res: any, index: number) => ({
          ...res,
          sourceUrl: groundingChunks?.[index]?.web?.uri || null
        }));
        setResults(enrichedResults);
      }
    } catch (err) {
      console.error("Legal research error:", err);
      setError("Failed to perform legal research. Please try again later.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">AI Legal Research</h1>
          </div>
          <p className="text-neutral-500">Search through thousands of Pakistani legal precedents, statutes, and case laws using natural language.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-8 bg-primary-900 relative overflow-hidden">
        <div className="relative z-10">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for precedents (e.g., 'Right to information under Article 19-A')..." 
                className="w-full bg-white/10 border border-white/20 rounded-2xl pl-14 pr-32 py-5 text-lg text-white placeholder:text-white/40 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all backdrop-blur-md"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
              <button 
                type="submit"
                disabled={isSearching}
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-primary px-8 py-3 bg-white text-primary-900 hover:bg-neutral-100 border-none shadow-lg flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : 'AI Search'}
              </button>
            </div>
          </form>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Trending:</span>
            {['Article 19-A', 'PPC 420', 'Family Law Ordinance', 'Taxation 2024'].map((tag, i) => (
              <button 
                key={i} 
                onClick={() => setSearchQuery(tag)}
                className="text-xs font-bold text-white/60 hover:text-white transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-800 rounded-full blur-3xl opacity-40"></div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-sm font-medium">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Filters</h3>
              <button className="text-xs text-primary-600 font-bold hover:underline">Reset</button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase mb-3 block">Court Type</label>
                <div className="space-y-2">
                  {['Supreme Court', 'High Court', 'District Court', 'Tribunals'].map((court, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500/20" />
                      <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">{court}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase mb-3 block">Year Range</label>
                <select className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20">
                  <option>Last 5 Years</option>
                  <option>Last 10 Years</option>
                  <option>All Time</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase mb-3 block">Practice Area</label>
                <div className="flex flex-wrap gap-2">
                  {['Criminal', 'Civil', 'Family', 'Tax', 'Corporate'].map((area, i) => (
                    <button key={i} className="px-3 py-1.5 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-all">
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-neutral-900 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest">AI Research Tip</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Try asking natural language questions like "What are the latest rulings on digital privacy in Pakistan?" for better results.
            </p>
          </div>

          <LegalChatbot
            className="h-[460px]"
            initialMessage="Ask me about legal concepts, research strategy, or how to understand a case law result."
            context="The user is using the AI Legal Research page to research Pakistani law, statutes, precedents, and legal concepts."
            placeholder="Ask about your research..."
            suggestions={[
              'Explain this statute',
              'Find related case law',
              'Summarize legal risks',
            ]}
          />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-neutral-500 font-medium text-center">
                AI is scanning legal databases...<br/>
                <span className="text-xs text-neutral-400">This may take a few seconds</span>
              </p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-500">Found {results.length} highly relevant results</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Sort by:</span>
                  <select className="bg-transparent border-none text-xs font-bold text-neutral-900 outline-none cursor-pointer">
                    <option>Relevance</option>
                    <option>Newest First</option>
                    <option>Most Cited</option>
                  </select>
                </div>
              </div>
              {results.map((result, i) => (
                <div key={i} className="card p-8 hover:border-primary-300 transition-all group">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                          result.court === 'Statute' ? 'bg-warning/10 text-warning' : 'bg-primary-50 text-primary-600'
                        }`}>
                          {result.court}
                        </span>
                        <span className="text-xs text-neutral-400">{result.date}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <TrendingUp className="w-3 h-3 text-success" />
                          <span className="text-xs font-bold text-success">{result.relevance || '90%'} Match</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors mb-4">
                        {result.title}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed mb-6">
                        {result.summary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.tags?.map((tag: string, j: number) => (
                          <span key={j} className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                        <Bookmark className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                        <Share2 className="w-5 h-5" />
                      </button>
                      {result.sourceUrl && (
                        <a 
                          href={result.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-sm font-bold text-neutral-400 hover:border-primary-300 hover:text-primary-600 transition-all">
                Load More Results
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-6">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Start your research</h3>
              <p className="text-neutral-500 max-w-md">
                Enter a query above to search through the most comprehensive legal database in Pakistan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
