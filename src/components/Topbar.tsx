import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topbar() {
  return (
    <header className="h-[var(--topbar-height)] bg-white border-b border-neutral-200 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input 
          type="text" 
          placeholder="Search cases, documents, or clients..." 
          className="w-full bg-neutral-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link 
          to="/notifications"
          className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full relative transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-neutral-900">Adv. Abdullah</p>
            <p className="text-xs text-neutral-500">Senior Partner</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold overflow-hidden">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
