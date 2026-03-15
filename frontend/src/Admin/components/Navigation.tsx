import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await api.get('/logout');
        navigate('/admin/login');
    };

    return  (
        <nav className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4 shadow-sm z-50">
                <div className="flex flex-col gap-y-8">
                    <div className="px-2">
                        <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
                            Student Resource<br/>Recommendation
                        </h2>
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <Link 
                            to="/home" 
                            className="px-4 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                            Home
                        </Link>
                        
                        <Link 
                            to="/profile" 
                            className="px-4 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                            Profile
                        </Link>
                        
                        <Link 
                            to="/resources" 
                            className="px-4 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                            Resources
                        </Link>
                        
                        <Link 
                            to="/curriculum" 
                            className="px-4 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                            Curriculum
                        </Link>

                        <Link 
                            to="/manage-admins" 
                            className="px-4 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                            Manage Admins
                        </Link>
                    </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                    <button 
                        onClick={handleLogout} 
                        className="w-full text-left px-4 py-2.5 rounded-lg text-red-600 font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </nav>
    );
};

export default Navbar;