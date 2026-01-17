import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail';
import TicketDetail from './pages/TicketDetail';
import Billing from './pages/Billing';
import MyTeam from './pages/MyTeam';
import JoinWorkspace from './pages/JoinWorkspace';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children, allowAuthenticated = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (allowAuthenticated) {
    return children;
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicRoute allowAuthenticated={true}><Landing /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/my-team" element={<PrivateRoute><MyTeam /></PrivateRoute>} />
          <Route path="/workspace/:id" element={<PrivateRoute><WorkspaceDetail /></PrivateRoute>} />
          <Route path="/workspace/:workspaceId/ticket/:ticketId" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
          <Route path="/workspace/:id/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/join/:token" element={<PrivateRoute><JoinWorkspace /></PrivateRoute>} />
          <Route path="/superadmin" element={<PrivateRoute><SuperAdminDashboard /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
