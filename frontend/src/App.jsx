import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './LandingPage';
import UploadPage from './UploadPage';
import ResultPage from './ResultPage';
import LoginPage from './LoginPage';
import Header from './components/Header';
import Footer from './components/Footer';
import Contact from './Contact';
import ResultChatPage from './ResultChatPage';
import DoctorSearchPage from './DoctorSearchPage';
import ProtectedRoute from './components/ProtectedRoute';

import InsuranceDashboard from './insurance/InsuranceDashboard';
import AddPolicyPage from './insurance/AddPolicyPage';
import CreateClaimWizard from './insurance/CreateClaimWizard';
import ClaimDetailsPage from './insurance/ClaimDetailsPage';
import ReviewerDashboard from './insurance/ReviewerDashboard';
import ReviewClaimPage from './insurance/ReviewClaimPage';

// Root Route: When running the project, unauthenticated users start on the
// Login and Signup page first. Once logged in, show the main Landing / Home Page.
const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#060a14] text-white">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <LandingPage />;
};

function App() {
  const [selectedImageType, setSelectedImageType] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-200">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<LoginPage />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage
                    selectedImageType={selectedImageType}
                    setSelectedImageType={setSelectedImageType}
                    setProcessedData={setProcessedData}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/results"
              element={
                <ProtectedRoute>
                  <ResultPage processedData={processedData} selectedImageType={selectedImageType} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resultchat"
              element={
                <ProtectedRoute>
                  <ResultChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="/search-doctor" element={<DoctorSearchPage />} />
            <Route path="/contact" element={<Contact />} />

            <Route
              path="/insurance"
              element={
                <ProtectedRoute>
                  <InsuranceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance/policies"
              element={
                <ProtectedRoute>
                  <InsuranceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance/policies/add"
              element={
                <ProtectedRoute>
                  <AddPolicyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance/claims"
              element={
                <ProtectedRoute>
                  <InsuranceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance/claims/create"
              element={
                <ProtectedRoute>
                  <CreateClaimWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance/claims/:id"
              element={
                <ProtectedRoute>
                  <ClaimDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance/claims/:id/documents"
              element={
                <ProtectedRoute>
                  <ClaimDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance/claims/:id/status"
              element={
                <ProtectedRoute>
                  <ClaimDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/insurance/claims"
              element={
                <ProtectedRoute>
                  <ReviewerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/insurance/claims/:id"
              element={
                <ProtectedRoute>
                  <ReviewClaimPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
