import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Resource } from '../../types.ts';
import { Button } from '../../components/Button';
import { DataTable, type ColumnDef } from '../components/DataTable';
import api from '../../api/axios.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faCalendar } from '@fortawesome/free-regular-svg-icons';
import toast from 'react-hot-toast';

const Resources = () => {
    const location = useLocation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const initializeResources = async () => {
            try {
                const result = await api.get("/resource");
                setResources(result.data.resources);
            } catch (error) {
                let errorMessage = "An unknown error occurred";
                if (error instanceof Error) errorMessage = error.message;
                else if (typeof error === 'string') errorMessage = error;
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        }
        initializeResources();
    }, []);

    const formatSessionRange = (startStr: string, endStr: string) => {
        if (!startStr || !endStr) return <span className="text-slate-400 italic">Not set</span>;
        
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        
        const datePart = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const startTimePart = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const endTimePart = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
                <FontAwesomeIcon icon={faCalendar} className="opacity-70" />
                <span>{datePart}, {startTimePart} - {endTimePart}</span>
            </div>
        );
    };

    // Define table columns
    const columns = useMemo<ColumnDef<Resource>[]>(() => [
        {
            header: "Name",
            cellClassName: "font-medium text-slate-900",
            cell: (resource) => resource.name
        },
        {
            header: "Dates",
            cell: (resource) => (
                <div className="flex flex-col gap-y-2">
                    {resource.sessions?.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()).slice(0, 3).map((session, idx) => (
                        <span key={idx} className="w-fit inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                            {formatSessionRange(session.start_datetime, session.end_datetime)}
                        </span>
                    ))}
                    {resource.sessions && resource.sessions.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            +{resource.sessions.length - 3} more
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Supported SubCpls",
            cell: (resource) => (
                <div className="flex flex-wrap gap-2 items-center">
                    {resource.subcpls?.slice(0, 3).map((subcpl, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                            {subcpl.code}
                        </span>
                    ))}
                    {resource.subcpls && resource.subcpls.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            +{resource.subcpls.length - 3} more
                        </span>
                    )}
                    {(!resource.subcpls || resource.subcpls.length === 0) && (
                        <span className="text-slate-400 italic text-xs">None</span>
                    )}
                </div>
            )
        },
        {
            header: "Actions",
            headerClassName: "text-center w-24",
            cellClassName: "text-center",
            cell: (resource) => (
                <div className="flex gap-2">
                    <Link 
                        to={`/resource/edit/${resource.resource_id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Edit Resource"
                    >
                        <FontAwesomeIcon icon={faPenToSquare} />
                    </Link>

                    <Link 
                        to={`/resource/roster/${resource.resource_id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="View Roster"
                    >
                        <FontAwesomeIcon icon={faPenToSquare} />
                    </Link>
                </div>
            )
        }
    ], []);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resources</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and track curriculum events.</p>
                </div>
                <Link to="/resource/create">
                    <Button variant="solid">Add Resource</Button>
                </Link>
            </div>

            <DataTable 
                data={resources}
                columns={columns}
                keyExtractor={(item) => item.resource_id}
                loading={loading}
                searchPlaceholder="Search by resource name..."
                emptyMessage="No resources added yet."
                searchPredicate={(item, searchTerm) => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                }
            />
        </div>
    );
}

export default Resources;