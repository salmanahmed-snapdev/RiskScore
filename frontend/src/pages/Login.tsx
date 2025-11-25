import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome } from 'lucide-react';
import api from '@/utils/api';

const GOOGLE_CLIENT_ID = '968072773992-id5aa0kigq1j8e28coas1sdl6tdk66kj.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:3000';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // Send the authorization code to the backend
      api.post('/auth/google', { code })
        .then(response => {
          const { token } = response.data;
          // Store the JWT in local storage
          localStorage.setItem('token', token);
          // Fetch user details
          return api.get('/auth/me');
        })
        .then(response => {
          const user = response.data;
          localStorage.setItem('currentUser', JSON.stringify(user));
          // Redirect to the dashboard
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Login failed:', error);
        });
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20profile%20email`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Anesthesia Risk Score 2.0</CardTitle>
          <CardDescription>Sign in to continue to the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleGoogleLogin} className="w-full">
            <Chrome className="mr-2 h-4 w-4" /> Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;