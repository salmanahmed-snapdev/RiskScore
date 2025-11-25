import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Render nothing or a loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-lg text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  );
};

export default Index;