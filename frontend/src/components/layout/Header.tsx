import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <Link to="/dashboard" className="text-xl font-bold text-primary">
        Anesthesia Risk Score 2.0
      </Link>
      <div className="flex items-center space-x-4">
        {currentUser && <span className="text-sm text-muted-foreground">Welcome, {currentUser?.name}</span>}
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;