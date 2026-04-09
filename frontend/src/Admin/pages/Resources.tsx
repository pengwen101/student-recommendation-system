import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Resource } from '../../types.ts';
import { Button } from '../../components/Button';
import api from '../../api/axios.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faMagnifyingGlass, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

const Resources = () => {
    const location = useLocation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredResources = useMemo(() => {
        if (!searchTerm) return resources;
        return resources.filter(resource => 
            resource.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [resources, searchTerm]);

    const totalPages = Math.ceil(filteredResources.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    const paginatedResources = filteredResources.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by resource name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Supported SubCpls</th>
                                <th className="px-6 py-4 text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody className="text-sm text-slate-800 divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 animate-pulse">
                                        Loading resources...
                                    </td>
                                </tr>
                            ) : paginatedResources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        {searchTerm ? `No resources found matching "${searchTerm}"` : "No resources added yet."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedResources.map((resource) => (
                                    <tr key={resource.resource_id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900">{resource.name}</td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-y-2">
                                                {resource.sessions?.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()).slice(0, 3).map((session, idx) => (
                                                    <span key={idx} className="w-fit inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                                                        {formatSessionRange(session.start_datetime, session.end_datetime)}
                                                    </span>
                                                ))}
                                            </div>

                                            {resource.sessions && resource.sessions.length > 3 && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    +{resource.sessions.length - 3} more
                                                </span>
                                            )}
                                        </td>
                                        
                                        {/* 3. SubCpl Pills Logic */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {resource.subcpls?.slice(0, 3).map((subcpl, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                                                    >
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
                                        </td>
                                        
                                        <td className="px-6 py-4 text-center">
                                            <Link 
                                                to={`/resource/edit/${resource.resource_id}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Edit Resource"
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredResources.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Showing <span className="font-medium text-slate-900">{startIndex + 1}</span> to <span className="font-medium text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredResources.length)}</span> of <span className="font-medium text-slate-900">{filteredResources.length}</span> results
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                            </Button>
                            
                            <span className="text-sm font-medium text-slate-700 px-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Resources;