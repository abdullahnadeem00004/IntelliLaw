import React, { useState } from 'react';
import { 
  Brain, 
  Upload, 
  FileText, 
  AlertCircle, 
  Scale, 
  Zap,
  ShieldCheck,
  Download,
  History
} from 'lucide-react';
import LegalChatbot from '../components/LegalChatbot';

export default function CaseAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">AI Case Analysis</h1>
          </div>
          <p className="text-neutral-500">Upload legal documents to extract insights, identify risks, and predict outcomes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <History className="w-4 h-4 mr-2" />
            Analysis History
          </button>
        </div>
      </div>

      {/* Upload Area */}
      {!analysisComplete && (
        <div className="card p-12 border-2 border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center text-center group hover:border-primary-400 hover:bg-primary-50/30 transition-all cursor-pointer">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm mb-6 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Drop legal documents here</h3>
          <p className="text-neutral-500 max-w-md mb-8">
            Supports PDF, DOCX, and Scanned Images. Our AI will automatically perform OCR and analyze the content.
          </p>
          <button 
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="btn btn-primary px-12 py-3 text-base font-bold shadow-lg shadow-primary-500/20"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing Document...
              </div>
            ) : (
              'Start AI Analysis'
            )}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysisComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
          {/* Main Insights */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary Card */}
            <div className="card p-8 bg-primary-900 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">Executive Summary</h3>
                </div>
                <p className="text-xl font-medium leading-relaxed mb-8">
                  The uploaded document is a "Writ Petition" filed in the Lahore High Court. 
                  The core legal argument centers on the violation of Fundamental Rights under 
                  Article 19-A of the Constitution of Pakistan.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Case Type</p>
                    <p className="text-sm font-bold mt-1">Constitutional</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Success Probability</p>
                    <p className="text-sm font-bold mt-1 text-success">68% (High)</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Complexity</p>
                    <p className="text-sm font-bold mt-1 text-warning">Medium</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-800 rounded-full blur-3xl opacity-40"></div>
            </div>

            {/* Key Findings */}
            <div className="card p-8">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Key Legal Findings</h3>
              <div className="space-y-6">
                {[
                  { title: 'Constitutional Violation', desc: 'The petition correctly identifies a breach of Article 19-A regarding the right to information.', icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10' },
                  { title: 'Jurisdictional Match', desc: 'The Lahore High Court has proper jurisdiction over the respondents mentioned.', icon: Scale, color: 'text-primary-600', bg: 'bg-primary-50' },
                  { title: 'Missing Precedent', desc: 'The argument could be strengthened by citing "PLD 2018 SC 123" regarding digital privacy.', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
                ].map((finding, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl border border-neutral-100 hover:border-primary-200 transition-all">
                    <div className={`w-12 h-12 rounded-xl ${finding.bg} ${finding.color} flex items-center justify-center shrink-0`}>
                      <finding.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-neutral-900">{finding.title}</h4>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{finding.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Entities */}
            <div className="card p-8">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Extracted Entities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Petitioner', value: 'Muhammad Zubair' },
                  { label: 'Respondent', value: 'Federation of Pakistan' },
                  { label: 'Court', value: 'Lahore High Court' },
                  { label: 'Legal Sections', value: 'Art. 19-A, 184(3)' },
                ].map((entity, i) => (
                  <div key={i} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{entity.label}</p>
                    <p className="text-sm font-bold text-neutral-900 mt-1">{entity.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Chat & Actions */}
          <div className="space-y-8">
            <LegalChatbot
              initialMessage="I've analyzed the document. You can ask me about legal points, risks, or next steps."
              context="The user is reviewing an AI case analysis for a Pakistani legal document. The sample analysis is a writ petition in the Lahore High Court involving Article 19-A of the Constitution of Pakistan."
              placeholder="Ask AI about this case..."
              suggestions={[
                'Explain the key findings',
                'Summarize the risks',
                'List next steps',
              ]}
            />

            {/* Quick Actions */}
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Next Steps</h3>
              <button className="btn btn-primary w-full py-3">
                <FileText className="w-4 h-4 mr-2" />
                Draft Rebuttal
              </button>
              <button className="btn btn-secondary w-full py-3">
                <Download className="w-4 h-4 mr-2" />
                Download Analysis
              </button>
              <button 
                onClick={() => setAnalysisComplete(false)}
                className="btn btn-ghost w-full py-3 text-xs"
              >
                Analyze Another Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
