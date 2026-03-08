import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Resource } from '../../types.ts';
import api from '../../api/axios.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import toast from 'react-hot-toast';

const Resources = () => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const [resources, setResources] = useState<Resource[]>([]);
    const location = useLocation();
    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }

        const initializeResources = async () => {
            const result = await api.get("/resource");
            setResources(result.data.resources);
        }

        initializeResources();
    }, [location.state]);

    return (
        <>
        <div className="text-2xl mb-4">Resources</div>
        <button className="bg-blue-500 text-white">Add Resource</button>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200 m-8">
            <table className="table-auto w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Start Date</th>
                        <th className="px-6 py-4">End Date</th>
                    </tr>
                </thead>
                <tbody className="text-sm text-gray-800">
                    {resources.map((resource) => (
                        <tr key={resource.resource_id} className="border-b border-gray-100 hover:bg-gray-200 transition-colors">
                            <td className="px-6 py-4 font-medium">{resource.name}</td>
                            <td className="px-6 py-4 text-gray-500">{formatDate(resource.start_datetime)}</td>
                            <td className="px-6 py-4 text-gray-500">{formatDate(resource.end_datetime)}</td>
                            <td className="px-6 py-4"><Link to={`/resource/edit/${resource.resource_id}`}><FontAwesomeIcon icon={faPenToSquare} /></Link></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </>
    )
}

export default Resources;