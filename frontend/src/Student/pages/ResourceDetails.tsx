import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Resource } from '../../types.ts';
import api from '../../api/axios.tsx';


function ResourceDetails(){
    const { resource_id } = useParams();

    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/student/login';
                    return;
                }
                const resource = await api.get(`/resource/${resource_id}`);
                setResource(resource.data.resource_details || null);
            } catch (error) {
                console.error("Failed to load resource", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [resource_id]);

    return (
        loading ? (
            <div>Loading...</div>
        ) : (
            <>
                <div>{resource?.name}</div>
                <div>{resource?.description}</div>
                <div>{resource?.start_datetime}</div>
                <div>{resource?.end_datetime}</div>
                {resource?.topics?.map((topic) => (
                    <div key={topic.topic_id}>
                    <div>{topic.name}</div>
                    <div>{topic.weight}</div>
                    </div>
                ))}

                {resource?.subcpls?.map((subcpl) => (
                    <div key={subcpl.sub_cpl_id}>
                        <div>{subcpl.name}</div>
                        {subcpl.qualities.map((quality) => (
                            <div key={quality.quality_id}>
                                <div>{quality.name}</div>
                            </div>
                        ))}
                    </div>
                ))}

                {resource?.calculated_qualities?.map((quality) => (
                    <div key={quality.quality_id}>
                        <div>{quality.name}</div>
                        <div>{quality.weight}</div>
                    </div>
                ))}
            </>
        )
    )
}

export default ResourceDetails;