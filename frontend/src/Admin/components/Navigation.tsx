import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Pane } from '../../components/Pane';
import { Button } from '../../components/Button';
import api from '../../api/axios';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        await api.get('/logout');
        navigate('/admin/login');
    };

    return  (
        <Pane className="fixed left-0 top-0 h-screen w-64 flex flex-col justify-between z-50 rounded-none border-y-0 border-l-0 border-r border-slate-200 bg-white p-6"> 

            <div className="flex flex-col gap-y-10">
                <div className="px-2">
                    <h2 className="text-xl font-bold text-primary-800 leading-tight">
                        Resource <br/>
                        <span className="text-slate-500 font-medium text-base">Recommendation</span>
                    </h2>
                </div>
                
                <nav className="flex flex-col gap-y-1">
                    <Link to="/home" className="w-full">
                        <Button 
                            variant={isActive("/home") ? "secondary" : "ghost"} 
                            className={`w-full justify-start ${isActive("/home") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
                        >
                            Home
                        </Button>
                    </Link>

                    <Link to="/resource" className="w-full">
                        <Button 
                            variant={isActive("/resource") ? "secondary" : "ghost"} 
                            className={`w-full justify-start ${isActive("/resource") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
                        >
                            Resources
                        </Button>
                    </Link>

                    <Link to="/curriculum" className="w-full">
                        <Button 
                            variant={isActive("/curriculum") ? "secondary" : "ghost"} 
                            className={`w-full justify-start ${isActive("/curriculum") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
                        >
                            Curriculum
                        </Button>
                    </Link>

                    <Link to="/manage-admins" className="w-full">
                        <Button 
                            variant={isActive("/manage-admins") ? "secondary" : "ghost"} 
                            className={`w-full justify-start ${isActive("/manage-admins") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
                        >
                            Manage Admins
                        </Button>
                    </Link>
               </nav>
            </div>

            <div className="pt-4 border-t border-slate-200">
                <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    className="w-full justify-start text-slate-600 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                >
                    Logout
                </Button>
            </div>
            
        </Pane>
    );
};

export default Navbar;