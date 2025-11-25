import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';

const AuthCallback = () => {
    const navigate = useNavigate();

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
                    localStorage.setItem('isLoggedIn', 'true');
                    navigate('/dashboard'); // redirect after successful login
                })
                .catch(err => {
                    console.error('Login failed:', err);
                });
        }
    }, [navigate]);

    return <div className="flex items-center justify-center min-h-screen">Logging in...</div>;
};

export default AuthCallback;
