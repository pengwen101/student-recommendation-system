import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await api.get('/logout');
        navigate('/student/login');
    };

    return (
        <nav className= "py-4 px-8 w-screen bg-white flex justify-between gap-x-2">
            <div className="flex gap-x-2">
                <div className="flex items-center justify-center text-black text-2xl">Student Resource Recommendation</div>
            </div>
            <div className="flex gap-x-2">
                <Link className="flex items-center justify-center" to="/home"><strong>Home</strong></Link>
                <Link className="flex items-center justify-center mr-4" to="/profile"><strong>Profile</strong></Link>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;