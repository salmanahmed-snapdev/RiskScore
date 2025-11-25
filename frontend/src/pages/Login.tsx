import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const handleSimulatedLogin = () => {
    // Simulate a successful login for frontend-only demonstration
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', 'Simulated User'); // Store a placeholder user
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Anesthesia Risk Score 2.0</CardTitle>
          <CardDescription>Sign in to continue to the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleSimulatedLogin} className="w-full">
            <Chrome className="mr-2 h-4 w-4" /> Continue with Simulated Login
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            For a real secure Google login and other backend features, you need to add a backend service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;