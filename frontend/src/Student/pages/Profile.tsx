import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { User, CalculatedQuality, Topic } from '../../types';

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [qualities, setQualities] = useState<CalculatedQuality[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 1. Get User ID
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/login';
                    return;
                }
                const userData: User = userRes.data.user;
                setUser(userData);

                // 2. Fetch Qualities and Topics in Parallel (Fast)
                const [qualitiesRes, topicsRes] = await Promise.all([
                    api.get(`/student/qualities/${userData.nrp}`),
                    api.get(`/student/topics/${userData.nrp}`)
                ]);

                setQualities(qualitiesRes.data.qualities || []);
                setTopics(topicsRes.data.topics || []);

            } catch (error) {
                console.error("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    if (loading) return <div>Loading Profile...</div>;
    if (!user) return <div>Error loading user.</div>;

    return (
        <div style={{ padding: '20px' }}>
            {/* Section 1: User Info */}
            <div style={{ marginBottom: '30px', borderBottom: '1px solid #ddd' }}>
                <img src={user.picture} alt="Profile" style={{ borderRadius: '50%', width: '80px' }} />
                <h2>{user.name}</h2>
                <p>{user.email}</p>
            </div>

            <div style={{ display: 'flex', gap: '50px' }}>
                {/* Section 2: Qualities */}
                <div style={{ flex: 1 }}>
                    <h3>My Qualities</h3>
                    <ul>
                        {qualities.map(q => (
                            <li key={q.quality_id}>
                                <strong>{q.name}</strong> (Score: {q.weight})
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Section 3: Topics */}
                <div style={{ flex: 1 }}>
                    <h3>My Interested Topics</h3>
                    <ul>
                        {topics.map(t => (
                            <li key={t.topic_id}>
                                <strong>{t.name}</strong> (Weight: {t.weight})
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Profile;