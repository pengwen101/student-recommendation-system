import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../api/axios';

const AdminGuard = () => {
    const [status, setStatus] = useState({
        loading: true,
        isAdmin: false,
    });

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const userRes = await api.get('/users/me');
                const role = userRes.data?.role;

                if (role === 'admin') {
                    setStatus({ loading: false, isAdmin: true });
                } else {
                    setStatus({ loading: false, isAdmin: false });
                }
            } catch {
                setStatus({ loading: false, isAdmin: false });
            }
        };

        checkAdmin();
    }, []);

    if (status.loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-slate-500 animate-pulse font-medium">Verifying admin access...</div>
            </div>
        );
    }

    if (!status.isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default AdminGuard;
