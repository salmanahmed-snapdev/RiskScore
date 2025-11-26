import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

const AuthCallback = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Send the authorization code to your backend
            api.post('/auth/google', { code })
                .then(res => {
                    localStorage.setItem('token', res.data.access_token);
                    return api.get('/auth/me', {
                        headers: {
                            Authorization: `Bearer ${res.data.access_token}` // send token to backend
                        }
                    });
                })
                .then(res => {
                    localStorage.setItem('currentUser', JSON.stringify(res.data));
                    login();
                    navigate('/dashboard'); // redirect after successful login
                })
                .catch(err => {
                    console.error('Login failed:', err);
                });
        }
    }, [navigate, login]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
                <p className='text-lg font-semibold'>Logging in</p>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
                <p className='text-sm text-gray-500'>Please wait while we log you in...</p>
            </div>
        </div>
    )
};

export default AuthCallback;
