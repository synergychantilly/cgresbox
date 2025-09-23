import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ScrollContainer from './ScrollContainer';
import {
  HomeIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  FolderIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const getNavigation = (isAdmin: boolean): NavigationItem[] => {
  const baseNavigation = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, description: 'Overview and quick access' },
    { id: 'calendar', name: 'Calendar', icon: CalendarDaysIcon, description: 'Schedule and important dates' },
    { id: 'updates', name: 'Updates', icon: MegaphoneIcon, description: 'Latest announcements' },
    // { id: 'resources', name: 'Resources', icon: FolderIcon, description: 'Documents and materials' }, // Hidden for now
    { id: 'qa', name: 'Q&A', icon: QuestionMarkCircleIcon, description: 'Community support' },
    { id: 'complaints', name: 'Complaints', icon: ExclamationTriangleIcon, description: 'Report issues' },
  ];

  // Only add Documents section for regular users, not admins
  if (!isAdmin) {
    baseNavigation.push({
      id: 'documents',
      name: 'Documents',
      icon: DocumentTextIcon,
      description: 'Personal paperwork'
    });
  }

  if (isAdmin) {
    baseNavigation.push({
      id: 'admin-documents',
      name: 'Document Management',
      icon: ShieldCheckIcon,
      description: 'Manage document templates and tracking'
    });
    baseNavigation.push({
      id: 'users',
      name: 'User Management',
      icon: UsersIcon,
      description: 'Manage users and approvals'
    });
    baseNavigation.push({
      id: 'user-tracking',
      name: 'User Tracking',
      icon: DocumentTextIcon,
      description: 'Track employee and new hire progress'
    });
  }

  return baseNavigation;
};

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userData, newHireSession, logout, isAdmin, isNewHire } = useAuth();

  // For new hires, only show documents
  const navigation = isNewHire ? [
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon, description: 'Complete your paperwork' }
  ] : getNavigation(isAdmin);

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">CareConnect</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-primary focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col h-full bg-white shadow-lg border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 xl:py-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base xl:text-lg">CC</span>
                </div>
              </div>
              <div className="ml-3 min-w-0">
                <h1 className="text-lg xl:text-xl font-bold text-gray-900 truncate">CareConnect</h1>
                <p className="text-xs xl:text-sm text-gray-600 truncate">Caregiver Dashboard</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 min-h-0">
              <ScrollContainer 
                className="px-4 py-2 xl:py-4"
                showScrollbar={false}
                showIndicators={true}
              >
                <div className="space-y-1 xl:space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handlePageChange(item.id)}
                        className={`nav-item w-full text-left ${
                          isActive ? 'active' : ''
                        } py-2 xl:py-3`}
                        title={item.description}
                      >
                        <Icon className="h-5 w-5 xl:h-6 xl:w-6 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm xl:text-base">{item.name}</p>
                          <p className="text-xs xl:text-sm text-gray-500 truncate leading-tight">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollContainer>
            </div>

            {/* User Profile */}
            <div className="border-t border-gray-200 p-3 xl:p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="h-8 w-8 xl:h-10 xl:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                    <span className="text-xs xl:text-sm">
                      {isNewHire ? 
                        (newHireSession?.firstName?.charAt(0).toUpperCase() || 'N') :
                        (userData?.name?.charAt(0).toUpperCase() || 'U')
                      }
                    </span>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-xs xl:text-sm font-semibold text-gray-900 truncate">
                      {isNewHire ? 
                        `${newHireSession?.firstName || ''} ${newHireSession?.lastName || ''}`.trim() || 'New Hire' :
                        (userData?.name || 'User')
                      }
                    </p>
                    <div className="flex items-center space-x-1 xl:space-x-2 min-w-0">
                      <p className="text-xs text-gray-600 truncate flex-1">
                        {isNewHire ? 
                          newHireSession?.occupation || 'New Hire' :
                          (userData?.email || '')
                        }
                      </p>
                      {isNewHire && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                          <UserCircleIcon className="h-2.5 w-2.5 xl:h-3 xl:w-3 mr-0.5" />
                          <span className="hidden xl:inline">New Hire</span>
                          <span className="xl:hidden">NH</span>
                        </span>
                      )}
                      {isAdmin && !isNewHire && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                          <ShieldCheckIcon className="h-2.5 w-2.5 xl:h-3 xl:w-3 mr-0.5" />
                          <span className="hidden xl:inline">Admin</span>
                          <span className="xl:hidden">A</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 xl:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 xl:h-5 xl:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center px-6 py-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CC</span>
                </div>
              </div>
              <div className="ml-3 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">CareConnect</h1>
                <p className="text-sm text-gray-600 truncate">Caregiver Dashboard</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 min-h-0">
              <ScrollContainer 
                className="px-4 py-4"
                showScrollbar={false}
                showIndicators={true}
              >
                <div className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handlePageChange(item.id)}
                        className={`nav-item w-full text-left ${
                          isActive ? 'active' : ''
                        }`}
                      >
                        <Icon className="h-6 w-6 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollContainer>
            </div>

            {/* User Profile */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {isNewHire ? 
                      (newHireSession?.firstName?.charAt(0).toUpperCase() || 'N') :
                      (userData?.name?.charAt(0).toUpperCase() || 'U')
                    }
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {isNewHire ? 
                        `${newHireSession?.firstName || ''} ${newHireSession?.lastName || ''}`.trim() || 'New Hire' :
                        (userData?.name || 'User')
                      }
                    </p>
                    <div className="flex items-center space-x-2 min-w-0">
                      <p className="text-xs text-gray-600 truncate flex-1">
                        {isNewHire ? 
                          newHireSession?.occupation || 'New Hire' :
                          (userData?.email || '')
                        }
                      </p>
                      {isNewHire && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                          <UserCircleIcon className="h-3 w-3 mr-1" />
                          New Hire
                        </span>
                      )}
                      {isAdmin && !isNewHire && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
