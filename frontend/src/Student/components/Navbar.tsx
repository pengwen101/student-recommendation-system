import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        try {
            localStorage.removeItem("access_token");
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
    
        <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 transition-all">
            
            <div className="flex items-center justify-between h-16 px-6 md:px-8">
           
                <div className="flex items-center">
                    <Link to="/home" className="text-xl font-bold text-primary-800 tracking-tight hover:opacity-80 transition-opacity">
                        Resource <span className="text-slate-500 font-medium">Recommendation</span>
                    </Link>
                </div>

                <div className="flex items-center gap-x-1 sm:gap-x-4">
                
                    <Link 
                        to="/home" 
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive('/home') 
                                ? 'text-primary-800 bg-primary-50' 
                                : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
                        }`}
                    >
                        Home
                    </Link>

                    <Link 
                        to="/recommendations" 
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive('/recommendations') 
                                ? 'text-primary-800 bg-primary-50' 
                                : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
                        }`}
                    >
                        Recommendations
                    </Link>

                    <Link 
                        to="/student/topics" 
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive('/student/topics') 
                                ? 'text-primary-800 bg-primary-50' 
                                : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
                        }`}
                    >
                        Topics
                    </Link>

                    <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2"></div>

                    <Button 
                        onClick={handleLogout} 
                        variant="ghost" 
                        size="sm"
                        className="text-slate-600 hover:text-danger-600 hover:bg-danger-50 ml-1"
                    >
                        Logout
                    </Button>
                </div>
                
            </div>
        </nav>
    );
};

export default Navbar;