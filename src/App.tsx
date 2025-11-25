
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SecurityProvider } from "./components/auth/SecurityProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { enableAllTables } from "./services/realtime-setup";
import { useEffect, Suspense, lazy } from "react";

// Lazy load route components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const TeleprompterWindow = lazy(() => import("./pages/TeleprompterWindow"));

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
      <Suspense fallback={<div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>}>
        <Routes>
          <Route path="/teleprompter" element={<TeleprompterWindow />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <div className="flex-1 overflow-hidden">
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            </div>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
