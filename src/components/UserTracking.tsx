import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUsers,
  subscribeToUsers
} from '../lib/userService';
import { 
  getNewHires, 
  subscribeToNewHires,
  type NewHire
} from '../lib/newHireService';
import { documentTemplateService, userDocumentService } from '../lib/documentsService';
import { User } from '../types';
import { DocumentTemplate, UserDocumentStatus } from '../types/documents';
import { 
  Users, 
  UserPlus,
  DocumentText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Calendar,
  Briefcase,
  MapPin,
  Eye,
  FileText
} from 'lucide-react';

interface UserTrackingStats {
  totalTemplates: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

const UserTracking: React.FC = () => {
  const { userData } = useAuth();
  const [activeView, setActiveView] = useState<'employees' | 'newhires'>('employees');
  const [employees, setEmployees] = useState<User[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [allUserDocuments, setAllUserDocuments] = useState<UserDocumentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userData?.role || userData.role !== 'admin') return;

    // Load templates first
    const loadTemplates = async () => {
      try {
        const templatesData = await documentTemplateService.getAll();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };

    // Set up real-time subscriptions
    const unsubscribeUsers = subscribeToUsers((users) => {
      // Only get approved users (active employees)
      const approvedUsers = users.filter(user => user.status === 'approved' && user.role === 'user');
      setEmployees(approvedUsers);
    });

    const unsubscribeNewHires = subscribeToNewHires((hires) => {
      // Only get active new hires
      const activeHires = hires.filter(hire => hire.isActive);
      setNewHires(activeHires);
    });

    // Load user documents
    const loadUserDocuments = async () => {
      try {
        const documents = await userDocumentService.getAllUserDocuments();
        setAllUserDocuments(documents);
      } catch (error) {
        console.error('Error loading user documents:', error);
      }
    };

    loadTemplates();
    loadUserDocuments();
    setLoading(false);

    return () => {
      unsubscribeUsers();
      unsubscribeNewHires();
    };
  }, [userData]);

  const getUserDocumentStats = (userId: string, isNewHire: boolean = false): UserTrackingStats => {
    let userDocs = allUserDocuments.filter(doc => doc.userId === userId);
    
    // For new hires, we need to create virtual documents since they might not exist yet
    if (isNewHire && userDocs.length === 0) {
      // Create virtual documents for all templates
      userDocs = templates.map(template => ({
        id: `virtual-${userId}-${template.id}`,
        userId,
        userName: '',
        documentTemplateId: template.id,
        status: 'not_started' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } else if (isNewHire && userDocs.length < templates.length) {
      // Fill missing templates for new hires
      const existingTemplateIds = userDocs.map(doc => doc.documentTemplateId);
      const missingTemplates = templates.filter(template => !existingTemplateIds.includes(template.id));
      
      const virtualDocs = missingTemplates.map(template => ({
        id: `virtual-${userId}-${template.id}`,
        userId,
        userName: '',
        documentTemplateId: template.id,
        status: 'not_started' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      userDocs = [...userDocs, ...virtualDocs];
    }

    const totalTemplates = templates.length;
    const notStarted = userDocs.filter(doc => doc.status === 'not_started').length;
    const inProgress = userDocs.filter(doc => doc.status === 'started' || doc.status === 'viewed').length;
    const completed = userDocs.filter(doc => doc.status === 'completed').length;
    const overdue = userDocs.filter(doc => {
      if (!doc.expiresAt) return false;
      return new Date() > doc.expiresAt && doc.status !== 'completed';
    }).length;

    return {
      totalTemplates,
      notStarted,
      inProgress,
      completed,
      overdue
    };
  };

  const getFilteredEmployees = () => {
    if (!searchTerm) return employees;
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredNewHires = () => {
    if (!searchTerm) return newHires;
    return newHires.filter(hire => 
      hire.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hire.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hire.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hire.zipCode.includes(searchTerm)
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading user tracking data...</p>
      </div>
    );
  }

  const filteredEmployees = getFilteredEmployees();
  const filteredNewHires = getFilteredNewHires();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Tracking</h1>
        <p className="text-gray-600">Monitor document completion progress for employees and new hires</p>
      </div>

      {/* View Selection Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Active Employees */}
        <div 
          onClick={() => setActiveView('employees')}
          className={`cursor-pointer p-6 rounded-lg border-2 transition-all duration-200 ${
            activeView === 'employees' 
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                activeView === 'employees' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Users className={`h-8 w-8 ${
                  activeView === 'employees' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Employees</h3>
                <p className="text-sm text-gray-600">Track approved user document progress</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
              <div className="text-sm text-gray-500">employees</div>
            </div>
          </div>
        </div>

        {/* New Hires */}
        <div 
          onClick={() => setActiveView('newhires')}
          className={`cursor-pointer p-6 rounded-lg border-2 transition-all duration-200 ${
            activeView === 'newhires' 
              ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                activeView === 'newhires' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <UserPlus className={`h-8 w-8 ${
                  activeView === 'newhires' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">New Hires</h3>
                <p className="text-sm text-gray-600">Track new hire onboarding progress</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{newHires.length}</div>
              <div className="text-sm text-gray-500">new hires</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeView === 'employees' ? 'employees' : 'new hires'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Content */}
      {activeView === 'employees' ? (
        /* Active Employees View */
        filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No employees found matching your search' : 'No active employees found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => {
              const stats = getUserDocumentStats(employee.id);
              return (
                <div key={employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{employee.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{employee.email}</p>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          Joined {employee.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Document Progress</span>
                      <span className="text-sm text-gray-500">
                        {stats.completed} / {stats.totalTemplates}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(stats.completed / Math.max(stats.totalTemplates, 1)) * 100}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stats.completed}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stats.notStarted}</div>
                          <div className="text-xs text-gray-500">Not Started</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stats.inProgress}</div>
                          <div className="text-xs text-gray-500">In Progress</div>
                        </div>
                      </div>
                      {stats.overdue > 0 && (
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{stats.overdue}</div>
                            <div className="text-xs text-gray-500">Overdue</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* New Hires View */
        filteredNewHires.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No new hires found matching your search' : 'No active new hires found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredNewHires.map((hire) => {
              const stats = getUserDocumentStats(hire.id, true);
              return (
                <div key={hire.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                      {hire.firstName.charAt(0).toUpperCase()}{hire.lastName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {hire.firstName} {hire.lastName}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="h-3 w-3 mr-1" />
                        <span className="truncate">{hire.occupation}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500 mr-3">{hire.zipCode}</span>
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          Added {hire.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Document Progress</span>
                      <span className="text-sm text-gray-500">
                        {stats.completed} / {stats.totalTemplates}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(stats.completed / Math.max(stats.totalTemplates, 1)) * 100}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stats.completed}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stats.notStarted}</div>
                          <div className="text-xs text-gray-500">Not Started</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stats.inProgress}</div>
                          <div className="text-xs text-gray-500">In Progress</div>
                        </div>
                      </div>
                      {stats.overdue > 0 && (
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{stats.overdue}</div>
                            <div className="text-xs text-gray-500">Overdue</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {hire.lastAccessAt && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center text-xs text-gray-500">
                          <FileText className="h-3 w-3 mr-1" />
                          Last accessed: {hire.lastAccessAt.toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default UserTracking;

