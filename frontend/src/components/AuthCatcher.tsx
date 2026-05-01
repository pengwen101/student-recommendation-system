import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCatcher = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('access_token', token);
      urlParams.delete('token');
      const newUrl = location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
      navigate(newUrl, { replace: true });
    }
  }, [location, navigate]);
  return null; 
}

export default AuthCatcher