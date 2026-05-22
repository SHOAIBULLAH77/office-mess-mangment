import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { StaffPage } from './pages/StaffPage';
import { MealPage } from './pages/MealPage';
import { ExpensePage } from './pages/ExpensePage';
import { ReportPage } from './pages/ReportPage';
import { LoginPage } from './pages/LoginPage';
import { LayoutDashboard, Users, Utensils, CreditCard, FileText, LogOut } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Staff', path: '/staff', icon: Users },
    { name: 'Meals', path: '/meals', icon: Utensils },
    { name: 'Expenses', path: '/expenses', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col pt-8 pb-4">
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mess Manager</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Office Admin</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              location.pathname === item.path
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <item.icon size={18} />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <Sidebar />}
      <main className={cn("flex-1", user ? "p-8" : "")}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <StaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meals"
              element={
                <ProtectedRoute>
                  <MealPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
