import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPendingUsers, 
  getUsers, 
  approveUser, 
  disableUser, 
  enableUser,
  subscribeToPendingUsers,
  promoteToAdmin,
  demoteFromAdmin,
  deleteUserCompletely
} from '../lib/userService';
import { 
  getNewHires, 
  addNewHire, 
  updateNewHire, 
  deleteNewHire, 
  deactivateNewHire, 
  reactivateNewHire, 
  subscribeToNewHires,
  type NewHire
} from '../lib/newHireService';
import AddNewHireModal from './modals/AddNewHireModal';
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
  Calendar,
  Crown,
  Trash2,
  UserMinus,
  UserPlus,
  Plus,
  Edit3,
  MapPin,
  Briefcase,
  Mail
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { userData, isMasterAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'newhires'>('pending');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'disabled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAddNewHire, setShowAddNewHire] = useState(false);
  const [editingNewHire, setEditingNewHire] = useState<NewHire | null>(null);

  // Real-time subscription to pending users
  useEffect(() => {
    if (!userData?.role || userData.role !== 'admin') return;

    const unsubscribe = subscribeToPendingUsers((users) => {
      setPendingUsers(users);
      setLoading(false);
    });

    return unsubscribe;
  }, [userData]);

  // Real-time subscription to new hires
  useEffect(() => {
    if (!userData?.role || userData.role !== 'admin') return;

    const unsubscribe = subscribeToNewHires((hires) => {
      setNewHires(hires);
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

  const handlePromoteToAdmin = async (userId: string) => {
    if (!userData?.id || !isMasterAdmin) return;
    
    setActionLoading(userId);
    try {
      await promoteToAdmin(userId, userData.id);
      setError('');
      if (activeTab === 'all') {
        await loadAllUsers();
      }
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      setError('Failed to promote user to admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    if (!userData?.id || !isMasterAdmin) return;
    
    setActionLoading(userId);
    try {
      await demoteFromAdmin(userId, userData.id);
      setError('');
      if (activeTab === 'all') {
        await loadAllUsers();
      }
    } catch (error) {
      console.error('Error demoting user from admin:', error);
      setError('Failed to demote user from admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userData?.id || !isMasterAdmin) return;
    
    setActionLoading(userId);
    try {
      await deleteUserCompletely(userId, userData.id);
      setError('');
      setConfirmDelete(null);
      // Remove from local state
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      setAllUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  // New hire handlers
  const handleAddNewHire = async (firstName: string, lastName: string, zipCode: string, occupation: string) => {
    if (!userData?.id) return;
    
    setActionLoading('add-new-hire');
    try {
      await addNewHire(firstName, lastName, zipCode, occupation, userData.id);
      setShowAddNewHire(false);
      setError('');
    } catch (error) {
      console.error('Error adding new hire:', error);
      setError('Failed to add new hire');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateNewHire = async (id: string, updates: Partial<NewHire>) => {
    setActionLoading(id);
    try {
      await updateNewHire(id, updates);
      setEditingNewHire(null);
      setError('');
    } catch (error) {
      console.error('Error updating new hire:', error);
      setError('Failed to update new hire');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateNewHire = async (id: string) => {
    setActionLoading(id);
    try {
      await deactivateNewHire(id);
      setError('');
    } catch (error) {
      console.error('Error deactivating new hire:', error);
      setError('Failed to deactivate new hire');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateNewHire = async (id: string) => {
    setActionLoading(id);
    try {
      await reactivateNewHire(id);
      setError('');
    } catch (error) {
      console.error('Error reactivating new hire:', error);
      setError('Failed to reactivate new hire');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNewHire = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteNewHire(id);
      setConfirmDelete(null);
      setError('');
    } catch (error) {
      console.error('Error deleting new hire:', error);
      setError('Failed to delete new hire');
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

  const getFilteredNewHires = () => {
    let hires = newHires;
    
    // Filter by search term
    if (searchTerm) {
      hires = hires.filter(hire => 
        hire.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hire.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hire.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hire.zipCode.includes(searchTerm)
      );
    }
    
    return hires;
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

  const getRoleBadge = (user: User) => {
    if (user.isMasterAdmin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border border-orange-200">
          <Crown className="h-3 w-3 mr-1" />
          Master Admin
        </span>
      );
    } else if (user.role === 'admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Users className="h-3 w-3 mr-1" />
          User
        </span>
      );
    }
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
  const filteredNewHires = getFilteredNewHires();

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
            <button
              onClick={() => setActiveTab('newhires')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'newhires'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                New Hires
                {newHires.filter(h => h.isActive).length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {newHires.filter(h => h.isActive).length}
                  </span>
                )}
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

        {/* Add New Hire Button (only for new hires tab) */}
        {activeTab === 'newhires' && (
          <button
            onClick={() => setShowAddNewHire(true)}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Hire
          </button>
        )}

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

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : activeTab === 'newhires' ? (
        // New Hires Content
        filteredNewHires.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No new hires found matching your search' : 'No new hires added yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddNewHire(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First New Hire
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ZIP Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNewHires.map((hire) => (
                    <tr key={hire.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-medium">
                              {hire.firstName.charAt(0).toUpperCase()}{hire.lastName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {hire.firstName} {hire.lastName}
                            </div>
                            {hire.lastAccessAt && (
                              <div className="text-xs text-gray-500">
                                Last accessed: {hire.lastAccessAt.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{hire.occupation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{hire.zipCode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {hire.createdAt.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hire.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 flex-wrap gap-1">
                          {/* Convert to User button - only for active new hires */}
                          {hire.isActive && (
                            <button
                              onClick={() => handleConvertNewHire(hire)}
                              disabled={actionLoading === hire.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Convert to User
                            </button>
                          )}

                          {hire.isActive ? (
                            <button
                              onClick={() => handleDeactivateNewHire(hire.id)}
                              disabled={actionLoading === hire.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateNewHire(hire.id)}
                              disabled={actionLoading === hire.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Reactivate
                            </button>
                          )}

                          {/* Delete button with confirmation */}
                          {confirmDelete === hire.id ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleDeleteNewHire(hire.id)}
                                disabled={actionLoading === hire.id}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(hire.id)}
                              disabled={actionLoading === hire.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
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
        )
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
                      {getRoleBadge(user)}
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
                      <div className="flex space-x-2 flex-wrap gap-1">
                        {/* Standard admin actions */}
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
                        {user.status === 'approved' && !user.isMasterAdmin && (
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

                        {/* Master Admin only actions */}
                        {isMasterAdmin && !user.isMasterAdmin && (
                          <>
                            {/* Role management */}
                            {user.role === 'user' && user.status === 'approved' && (
                              <button
                                onClick={() => handlePromoteToAdmin(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                Make Admin
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <button
                                onClick={() => handleDemoteFromAdmin(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Remove Admin
                              </button>
                            )}
                            
                            {/* Delete user */}
                            {confirmDelete === user.id ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        
                        {/* Show master admin indicator */}
                        {user.isMasterAdmin && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-900">
                            <Crown className="h-3 w-3 mr-1" />
                            Protected
                          </span>
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

      {/* Add New Hire Modal */}
      <AddNewHireModal
        isOpen={showAddNewHire}
        onClose={() => setShowAddNewHire(false)}
        onAdd={handleAddNewHire}
        loading={actionLoading === 'add-new-hire'}
      />

    </div>
  );
};

export default UserManagement;
