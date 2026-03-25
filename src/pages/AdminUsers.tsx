import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Edit2, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface User {
  _id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'LAWYER' | 'STAFF' | 'CLIENT';
  photoURL?: string;
  createdAt: string;
}

type UserRole = 'ADMIN' | 'LAWYER' | 'STAFF' | 'CLIENT';

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'ADMIN', label: 'Admin', color: 'bg-error/10 text-error' },
  { value: 'LAWYER', label: 'Lawyer', color: 'bg-primary/10 text-primary-600' },
  { value: 'STAFF', label: 'Staff', color: 'bg-info/10 text-info' },
  { value: 'CLIENT', label: 'Client', color: 'bg-success/10 text-success' },
];

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/auth/admin/change-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setSuccess(`Role updated successfully to ${newRole}`);
      setEditingId(null);
      setSelectedRole(null);

      // Refresh users list
      fetchUsers();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      console.error('Error updating role:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: UserRole): string => {
    const roleObj = ROLES.find((r) => r.value === role);
    return roleObj?.color || 'bg-neutral-100 text-neutral-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900">User Management</h1>
        <p className="text-neutral-500">View all users and manage their roles</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12 w-full"
        />
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{u.displayName || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{u.email}</td>
                    <td className="px-6 py-4">
                      {editingId === u._id ? (
                        <select
                          value={selectedRole || u.role}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="input-field text-sm py-1"
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge px-3 py-1 text-xs font-bold ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingId === u._id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (selectedRole && selectedRole !== u.role) {
                                handleChangeRole(u._id, selectedRole);
                              } else {
                                setEditingId(null);
                              }
                            }}
                            disabled={updating}
                            className="btn btn-primary py-1.5 px-3 text-xs"
                          >
                            {updating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setSelectedRole(null);
                            }}
                            disabled={updating}
                            className="btn btn-secondary py-1.5 px-3 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(u._id);
                            setSelectedRole(u.role);
                          }}
                          className="btn btn-ghost py-1.5 px-3 text-xs hover:bg-neutral-100 text-primary-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {ROLES.map((role) => (
          <div key={role.value} className="card p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900">
              {users.filter((u) => u.role === role.value).length}
            </p>
            <p className="text-xs text-neutral-500 uppercase font-bold mt-1">{role.label}s</p>
          </div>
        ))}
      </div>
    </div>
  );
}
