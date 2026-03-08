import api from '../../api/axios.tsx';
import { useState, useEffect } from 'react';

const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8000/admin/login";
    };

    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            const userRes = await api.get('/users/me');
            if ('role' in userRes){
                setIsPending((userRes.data.user.role == "pending_admin"));
            }
        };
        
        checkAdminStatus();
    }, []);

    return (
        <div className="h-screen flex justify-center items-center">
            <div className="w-3/4 flex flex-col justify-center items-center gap-6 text-center">
                <h1>Welcome to Student Resource Recommendation System</h1>
                <button className="px-4 py-2 rounded-full cursor-pointer" onClick={handleGoogleLogin}>
                    Sign in with Google
                </button>
                {isPending && (
                    <div className = "text-red-500">Wait to be accepted.</div>
                )}
            </div>
        </div>
    );
};

export default Login;