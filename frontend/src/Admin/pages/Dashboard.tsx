import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button';

export default function Dashboard() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
    <>

        <Link to="/support_lack_gap" className="w-full">
            <Button 
                variant={isActive("/support_lack_gap") ? "secondary" : "ghost"} 
                className={`w-full justify-start ${isActive("/support_lack_gap") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
            >
                Support Lack Gap
            </Button>
        </Link>

        <Link to="/resource_characteristic" className="w-full">
            <Button 
                variant={isActive("/resource_characteristic") ? "secondary" : "ghost"} 
                className={`w-full justify-start ${isActive("/resource_characteristic") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
            >
                Resource Characteristic
            </Button>
        </Link>

        <Link to="/organizer_support" className="w-full">
            <Button 
                variant={isActive("/organizer_support") ? "secondary" : "ghost"} 
                className={`w-full justify-start ${isActive("/organizer_support") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
            >
                Organizer Support
            </Button>
        </Link>

        <Link to="/student_performance" className="w-full">
            <Button 
                variant={isActive("/student_performance") ? "secondary" : "ghost"} 
                className={`w-full justify-start ${isActive("/student_performance") ? "text-primary-800 font-semibold" : "text-slate-600"}`}
            >
                Student Performance
            </Button>
        </Link>
    </>

);
}