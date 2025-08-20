import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthWrapper from './components/AuthWrapper';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Updates from './components/Updates';
import Resources from './components/Resources';
import QA from './components/QA';
import Complaints from './components/Complaints';
import Documents from './components/Documents';
import AdminDocuments from './components/AdminDocuments';
import UserManagement from './components/UserManagement';
import { createAdminUser, createAdminUserDocument, checkAdminUserDocument } from './lib/adminSetup';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={handlePageChange} />;
      case 'calendar':
        return <Calendar />;
      case 'updates':
        return <Updates />;
      case 'resources':
        return <Resources />;
      case 'qa':
        return <QA />;
      case 'complaints':
        return <Complaints />;
      case 'documents':
        return <Documents />;
      case 'admin-documents':
        return <AdminDocuments />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard onPageChange={handlePageChange} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderCurrentPage()}
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Make admin functions available globally
    (window as any).createAdminUser = createAdminUser;
    (window as any).createAdminUserDocument = createAdminUserDocument;
    (window as any).checkAdminUserDocument = checkAdminUserDocument;
    
    // Log instructions for admin setup
    console.log('%c🔧 CareConnect Admin Setup', 'color: #3B82F6; font-size: 16px; font-weight: bold;');
    console.log('%cAvailable commands:', 'color: #059669; font-weight: bold;');
    console.log('%ccheckAdminUserDocument() - Check if admin user document exists', 'background: #F3F4F6; color: #1F2937; padding: 2px 6px; border-radius: 4px; font-family: monospace;');
    console.log('%ccreateAdminUserDocument() - Create missing admin user document', 'background: #F3F4F6; color: #1F2937; padding: 2px 6px; border-radius: 4px; font-family: monospace;');
    console.log('%ccreateAdminUser() - Create complete admin user (if needed)', 'background: #F3F4F6; color: #1F2937; padding: 2px 6px; border-radius: 4px; font-family: monospace;');
  }, []);

  return (
    <AuthProvider>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </AuthProvider>
  );
}

export default App;
