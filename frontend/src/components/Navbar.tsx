import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await api.get('/logout');
        navigate('/login');
    };

    return (
        <nav style={{ padding: '1rem', background: '#f0f0f0', display: 'flex', gap: '20px' }}>
            <Link to="/home"><strong>Home</strong> (Recommendations)</Link>
            <Link to="/profile"><strong>Profile</strong></Link>
            <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Logout</button>
        </nav>
    );
};

export default Navbar;