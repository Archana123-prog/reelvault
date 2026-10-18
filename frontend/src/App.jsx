import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import { Loader, ServerWakingBanner } from './components/Loader';
import Modal from './components/Modal';
import AddReelForm from './components/AddReelForm';
import CategoryModal from './components/CategoryModal';
import { getCategories } from './api/categories';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ShareAdd from './pages/ShareAdd';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Opening your ReelVault..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Component (redirects to / if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  const { isServerWaking, isAuthenticated } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories for global Add Reel modal if opened from Navbar
  const openAddModal = async () => {
    try {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setIsAddModalOpen(true);
  };

  const openCategoryModal = async () => {
    try {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setIsCategoryModalOpen(true);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Render free tier cold-start warning banner */}
        {isServerWaking && <ServerWakingBanner />}

        {/* Global Navbar */}
        <Navbar
          onOpenAddModal={openAddModal}
          onOpenCategoryModal={openCategoryModal}
        />

        {/* Main Routed Content */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add"
              element={
                <ProtectedRoute>
                  <ShareAdd />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Global Modal for quick Add from Navbar */}
        {isAuthenticated && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Save New Reel"
            maxWidth="max-w-2xl"
          >
            <AddReelForm
              categories={categories}
              onReelAdded={async () => {
                setIsAddModalOpen(false);
                // Trigger page reload / event or navigation to refresh
                window.location.reload();
              }}
              onClose={() => setIsAddModalOpen(false)}
            />
          </Modal>
        )}

        {/* Global Category Modal from Navbar */}
        {isAuthenticated && (
          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            categories={categories}
            onCategoriesUpdated={async () => {
              const res = await getCategories();
              if (res.success && res.data) setCategories(res.data);
            }}
          />
        )}
      </div>
    </ToastProvider>
  );
};

export default App;
