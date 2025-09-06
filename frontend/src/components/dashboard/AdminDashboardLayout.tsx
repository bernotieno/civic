import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminDashboardLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen safe-area-padding prevent-horizontal-scroll" style={{ backgroundColor: '#f8fffe' }}>
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-0 lg:ml-64 pt-14 sm:pt-16">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;