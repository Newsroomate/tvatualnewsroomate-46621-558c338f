
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import TeleprompterWindow from "./pages/TeleprompterWindow";
import { AuthProvider } from "./context/AuthContext";
import { SecurityProvider } from "./components/auth/SecurityProvider";
import { AppHeader } from "./components/AppHeader";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { enableAllTables } from "./services/realtime-setup";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.code === 'PGRST116' || error?.message?.includes('permission')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const AppContent = () => {
  // Initialize realtime setup after component mount to avoid blocking initial page load
  useEffect(() => {
    // Defer realtime setup to not block critical rendering path
    const timer = setTimeout(() => {
      enableAllTables();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Routes>
        <Route path="/teleprompter" element={<TeleprompterWindow />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <>
            <AppHeader />
            <div className="flex-1 overflow-hidden">
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            </div>
          </>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SecurityProvider>
            <AppContent />
          </SecurityProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
