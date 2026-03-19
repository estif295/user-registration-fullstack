import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const SocialLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get token and user from URL parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    
    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error parsing user data:', error);
        toast.error('Login failed. Please try again.');
        navigate('/login');
      }
    } else {
      const error = params.get('error');
      if (error) {
        toast.error(error.replace(/_/g, ' '));
      } else {
        toast.error('Invalid login response');
      }
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
};

export default SocialLogin;