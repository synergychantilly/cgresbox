import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPendingUsers, 
  getUsers, 
  approveUser, 
  disableUser, 
  enableUser,
  subscribeToPendingUsers 
} from '../lib/userService';
import { User } from '../types';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  Eye,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  UserX,
  Calendar
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { userData } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'disabled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Real-time subscription to pending users
  useEffect(() => {
    if (!userData?.role || userData.role !== 'admin') return;

    const unsubscribe = subscribeToPendingUsers((users) => {
      setPendingUsers(users);
      setLoading(false);
    });

    return unsubscribe;
  }, [userData]);

  // Load all users when switching to 'all' tab
  useEffect(() => {
    if (activeTab === 'all' && userData?.role === 'admin') {
      loadAllUsers();
    }
  }, [activeTab, userData]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const users = await getUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!userData?.id) return;
    
    setActionLoading(userId);
    try {
      await approveUser(userId, userData.id);
      setError('');
      // Update local state
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      if (activeTab === 'all') {
        await loadAllUsers();
      }
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisableUser = async (userId: string, reason?: string) => {
    if (!userData?.id) return;
    
    setActionLoading(userId);
    try {
      await disableUser(userId, userData.id, reason);
      setError('');
      // Update local state
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      if (activeTab === 'all') {
        await loadAllUsers();
      }
    } catch (error) {
      console.error('Error disabling user:', error);
      setError('Failed to disable user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnableUser = async (userId: string) => {
    if (!userData?.id) return;
    
    setActionLoading(userId);
    try {
      await enableUser(userId, userData.id);
      setError('');
      if (activeTab === 'all') {
        await loadAllUsers();
      }
    } catch (error) {
      console.error('Error enabling user:', error);
      setError('Failed to enable user');
    } finally {
      setActionLoading(null);
    }
  };

  const getFilteredUsers = () => {
    let users = activeTab === 'pending' ? pendingUsers : allUsers;
    
    // Filter by status
    if (filterStatus !== 'all') {
      users = users.filter(user => user.status === filterStatus);
    }
    
    // Filter by search term
    if (searchTerm) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return users;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Disabled
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Users className="h-3 w-3 mr-1" />
        User
      </span>
    );
  };

  if (!userData || userData.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 text-lg font-medium">Access Denied</div>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage user accounts and approvals</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pending Approvals
                {pendingUsers.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {pendingUsers.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                All Users
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter for All Users tab */}
          {activeTab === 'all' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => activeTab === 'all' ? loadAllUsers() : null}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {activeTab === 'pending' ? 'No pending approvals' : 'No users found'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {user.createdAt.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleDisableUser(user.id, 'Rejected during approval')}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        {user.status === 'approved' && user.role !== 'admin' && (
                          <button
                            onClick={() => handleDisableUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Disable
                          </button>
                        )}
                        {user.status === 'disabled' && (
                          <button
                            onClick={() => handleEnableUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Enable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
