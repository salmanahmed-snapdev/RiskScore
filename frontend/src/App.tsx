import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings"; // Import the new Settings page
import React from "react";
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider

const queryClient = new QueryClient();

// PrivateRoute component to protect dashboard access
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme"> {/* Wrap with ThemeProvider */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;