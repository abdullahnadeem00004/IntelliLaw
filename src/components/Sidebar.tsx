import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  Calendar as CalendarIcon,
  FileText, 
  CheckSquare, 
  Users, 
  CreditCard, 
  Settings,
  Scale,
  LogOut,
  Brain,
  BookOpen,
  BarChart3,
  MessageSquare,
  Building2,
  Book
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from './FirebaseProvider';
import { UserRole } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  allowedRoles?: UserRole[];
}

// Define all navigation items with role-based access
const allNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Briefcase, label: 'Cases', path: '/cases', allowedRoles: [UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN] },
  { icon: Brain, label: 'AI Analysis', path: '/analysis', allowedRoles: [UserRole.LAWYER, UserRole.CLIENT, UserRole.ADMIN] },
  { icon: BookOpen, label: 'Legal Research', path: '/research', allowedRoles: [UserRole.LAWYER, UserRole.CLIENT, UserRole.ADMIN] },
  { icon: Book, label: 'Knowledge Base', path: '/knowledge-base' },
  { icon: CalendarIcon, label: 'Calendar', path: '/calendar' },
  { icon: Calendar, label: 'Hearings', path: '/hearings', allowedRoles: [UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN] },
  { icon: MessageSquare, label: 'Messages', path: '/messaging' },
  { icon: Users, label: 'Team', path: '/team', allowedRoles: [UserRole.LAWYER, UserRole.ADMIN] },
  { icon: Building2, label: 'Firm Profile', path: '/firm-profile', allowedRoles: [UserRole.LAWYER, UserRole.ADMIN] },
  { icon: BarChart3, label: 'Reports', path: '/reports', allowedRoles: [UserRole.ADMIN] },
  { icon: Users, label: 'User Management', path: '/admin/users', allowedRoles: [UserRole.ADMIN] },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Users, label: 'Clients', path: '/clients', allowedRoles: [UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN] },
  { icon: CreditCard, label: 'Billing', path: '/billing', allowedRoles: [UserRole.ADMIN] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, userProfile } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/role-selection', { replace: true });
  };

  // Filter navigation items based on user role
  const filteredNavItems = allNavItems.filter((item) => {
    // If no role restrictions, show to all
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
      return true;
    }
    // Show if user's role is in allowed roles
    return userProfile && item.allowedRoles.includes(userProfile.role);
  });

  // Get role badge color and text
  const getRoleBadge = () => {
    if (!userProfile) return { bg: 'bg-neutral-700', text: 'text-neutral-300', label: 'Unknown' };
    
    const roleBadges: Record<UserRole, { bg: string; text: string; label: string }> = {
      [UserRole.ADMIN]: { bg: 'bg-error/20', text: 'text-error', label: 'Admin' },
      [UserRole.LAWYER]: { bg: 'bg-primary-500/20', text: 'text-primary-400', label: 'Lawyer' },
      [UserRole.STAFF]: { bg: 'bg-info-500/20', text: 'text-info-400', label: 'Staff' },
      [UserRole.CLIENT]: { bg: 'bg-success-500/20', text: 'text-success-400', label: 'Client' },
    };
    
    return roleBadges[userProfile.role];
  };

  const roleBadge = getRoleBadge();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-neutral-900 text-neutral-400 border-r border-neutral-800 z-50 flex flex-col">
      {/* Logo */}
      <div className="h-[var(--topbar-height)] flex items-center px-6 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-white">
          <Scale className="w-8 h-8 text-primary-500" />
          <span className="text-xl font-bold tracking-tight">IntelliLaw</span>
        </div>
      </div>

      {/* User Role Badge */}
      {userProfile && (
        <div className={cn('mx-4 mt-3 px-3 py-2 rounded-lg', roleBadge.bg)}>
          <p className={cn('text-xs font-semibold', roleBadge.text)}>{roleBadge.label}</p>
          <p className="text-xs text-neutral-400 truncate">{userProfile.displayName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-primary-600 text-white" 
                : "hover:bg-neutral-800 hover:text-neutral-200"
            )}
            title={item.allowedRoles && item.allowedRoles.length > 0 ? `Available to: ${item.allowedRoles.join(', ')}` : undefined}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              "group-hover:text-primary-400"
            )} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            isActive 
              ? "bg-neutral-800 text-white" 
              : "hover:bg-neutral-800 hover:text-neutral-200"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:bg-error/10 transition-all duration-200">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
