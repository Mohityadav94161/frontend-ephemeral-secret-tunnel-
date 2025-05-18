import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { initFootprintTracker, getFootprintTracker } from "./utils/footprintTracker";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminAuthGuard from "./components/AdminAuthGuard";
import Index from "./pages/Index";
import Paste from "./pages/Paste";
import FileShare from "./pages/FileShare";
import Chat from "./pages/Chat";
import Register from "./pages/Register";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatRedirect from "./pages/ChatRedirect";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminChats from "./pages/admin/AdminChats";
import AdminPastes from "./pages/admin/AdminPastes";
import AdminFiles from "./pages/admin/AdminFiles";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminSettings from "./pages/admin/AdminSettings";
import Feedback from "./pages/Feedback";
import { API_URL } from '@/config';
import { NotificationProvider } from './contexts/NotificationContext';

const queryClient = new QueryClient();

// Component to track route changes
function RouteTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Initialize footprint tracker for guests if not already started
    const tracker = getFootprintTracker() || initFootprintTracker();
    
    // Track page navigation
    tracker.trackEvent('navigation', {
      path: location.pathname,
      search: location.search
    });
  }, [location]);
  
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <RouteTracker />
            <div className="flex flex-col min-h-screen bg-dark">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/paste" element={<Paste />} />
                  <Route path="/paste/:pasteId" element={<Paste />} />
                  <Route path="/fileshare" element={<FileShare />} />
                  <Route path="/fileshare/:fileId" element={<FileShare />} />
                  <Route path="/share/:fileId" element={<FileShare />} />
                  <Route path="/feedback" element={<Feedback />} />
                  
                  {/* Protected Chat Routes */}
                  <Route 
                    path="/chat" 
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/chat/:chatId" 
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Protected Profile Route */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={
                    <AdminAuthGuard>
                      <AdminDashboard />
                    </AdminAuthGuard>
                  } />
                  <Route path="/admin/chats" element={
                    <AdminAuthGuard>
                      <AdminChats />
                    </AdminAuthGuard>
                  } />
                  <Route path="/admin/pastes" element={
                    <AdminAuthGuard>
                      <AdminPastes />
                    </AdminAuthGuard>
                  } />
                  <Route path="/admin/files" element={
                    <AdminAuthGuard>
                      <AdminFiles />
                    </AdminAuthGuard>
                  } />
                  <Route path="/admin/users" element={
                    <AdminAuthGuard>
                      <AdminUsers />
                    </AdminAuthGuard>
                  } />
                  <Route path="/admin/feedback" element={
                    <AdminAuthGuard>
                      <AdminFeedback />
                    </AdminAuthGuard>
                  } />
                  <Route path="/admin/settings" element={
                    <AdminAuthGuard>
                      <AdminSettings />
                    </AdminAuthGuard>
                  } />
                  
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/c/:roomCode" element={<ChatRedirect />} />
                  <Route path="/p/:shortCode" element={<Paste />} />
                  <Route path="/f/:shortCode" element={<FileShare />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </NotificationProvider>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
