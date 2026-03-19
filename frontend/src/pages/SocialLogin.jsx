import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const SocialLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('📍 SocialLogin component mounted');
    console.log('📍 Full URL:', window.location.href);
    
    // Get token and user from URL parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    
    console.log('📦 Token from URL:', token ? '✅ Present' : '❌ Missing');
    console.log('📦 User param from URL:', userParam ? '✅ Present' : '❌ Missing');
    
    if (token && userParam) {
      try {
        // Decode and parse user data
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ Parsed user:', user);
        
        // Clear any existing data
        localStorage.clear();
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('💾 Data saved to localStorage');
        toast.success(`Welcome ${user.name}!`);
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('❌ Error parsing user:', error);
        toast.error('Login failed');
        navigate('/login', { replace: true });
      }
    } else {
      console.error('❌ Missing token or user data');
      const error = params.get('error');
      if (error) {
        toast.error(decodeURIComponent(error));
      } else {
        toast.error('Invalid login response');
      }
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Completing login...</p>
        <p className="mt-2 text-sm text-gray-400">Please wait while we redirect you</p>
      </div>
    </div>
  );
};

export default SocialLogin;