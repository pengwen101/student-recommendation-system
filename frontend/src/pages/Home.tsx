import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { EventItem, User } from '../types';

const Home = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Current User to find their ID
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/login';
                    return;
                }
                const user: User = userRes.data.user;

                // 2. Use ID to get Recommendations
                const recRes = await api.get(`/student/recommendations/${user.student_id}`);
                
                // Assuming backend returns { recommendations: [...] }
                setEvents(recRes.data.recommendations || []); 
            } catch (error) {
                console.error("Failed to load home", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading Recommendations...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Recommended Events for You</h1>
            <div style={{ display: 'grid', gap: '15px' }}>
                {events.map(event => (
                    <div key={event.event_id} style={{ border: '1px solid #ccc', padding: '15px' }}>
                        <h3>{event.event_name}</h3>
                        <small>Match Score: {event.probability_score}%</small>
                    </div>
                ))}
                {events.length === 0 && <p>No recommendations found yet.</p>}
            </div>
        </div>
    );
};

export default Home;