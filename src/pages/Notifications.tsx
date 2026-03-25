import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Briefcase, 
  Calendar, 
  FileText, 
  CreditCard, 
  MoreVertical,
  Trash2,
  Check,
  Filter,
  Search
} from 'lucide-react';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'hearing',
      title: 'Upcoming Hearing Reminder',
      message: 'Hearing for case "State vs. Ahmed Ali" is scheduled for tomorrow at 10:30 AM in Lahore High Court.',
      time: '2 hours ago',
      isRead: false,
      icon: Calendar,
      color: 'text-primary-600',
      bg: 'bg-primary-50'
    },
    {
      id: 2,
      type: 'document',
      title: 'New Document Shared',
      message: 'Adv. Abdullah has shared "Writ_Petition_Final.pdf" with you for review.',
      time: '5 hours ago',
      isRead: false,
      icon: FileText,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      id: 3,
      type: 'billing',
      title: 'Invoice Overdue',
      message: 'Invoice #INV-2024-001 is now 3 days overdue. Please make a payment to avoid service interruption.',
      time: '1 day ago',
      isRead: true,
      icon: CreditCard,
      color: 'text-error',
      bg: 'bg-error/10'
    },
    {
      id: 4,
      type: 'task',
      title: 'Task Assigned',
      message: 'You have been assigned a new task: "Prepare Witness List" for case LHC-2024-001.',
      time: '2 days ago',
      isRead: true,
      icon: Briefcase,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      id: 5,
      type: 'system',
      title: 'AI Analysis Complete',
      message: 'The AI analysis for the document "Evidence_Set_A.pdf" is now complete and ready for review.',
      time: '3 days ago',
      isRead: true,
      icon: CheckCircle2,
      color: 'text-primary-600',
      bg: 'bg-primary-50'
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Notifications</h1>
          </div>
          <p className="text-neutral-500">Stay updated with your latest case activities and alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="btn btn-secondary"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex p-1 bg-neutral-100 rounded-xl w-fit">
          {['all', 'unread', 'archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab 
                  ? "bg-white text-primary-600 shadow-sm" 
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 w-full md:w-64"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`card p-6 flex gap-6 group transition-all hover:border-primary-200 ${
                !notification.isRead ? "border-l-4 border-l-primary-600 bg-primary-50/10" : ""
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl ${notification.bg} ${notification.color} flex items-center justify-center shrink-0`}>
                <notification.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h3 className={`text-base font-bold truncate ${!notification.isRead ? "text-neutral-900" : "text-neutral-600"}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-neutral-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {notification.message}
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <button className="text-xs font-bold text-primary-600 hover:underline">View Details</button>
                  {!notification.isRead && (
                    <button className="text-xs font-bold text-neutral-400 hover:text-neutral-900">Mark as read</button>
                  )}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300 mb-6">
              <Bell className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">All caught up!</h3>
            <p className="text-neutral-500 max-w-xs">
              You don't have any new notifications at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredNotifications.length > 0 && (
        <button className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-sm font-bold text-neutral-400 hover:border-primary-300 hover:text-primary-600 transition-all">
          Load Previous Notifications
        </button>
      )}
    </div>
  );
}
