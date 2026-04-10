import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Organizer } from '../../types.ts';
import { Button } from '../../components/Button.tsx';
import { DataTable, type ColumnDef } from '../components/DataTable.tsx';
import api from '../../api/axios.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import toast from 'react-hot-toast';

const Organizers = () => {
    const location = useLocation();
    const [organizers, setOrganizers] = useState<Organizer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const initializeOrganizers = async () => {
            try {
                const result = await api.get("/organizer");
                setOrganizers(result.data.organizers);
            } catch (error) {
                let errorMessage = "An unknown error occurred";
                if (error instanceof Error) errorMessage = error.message;
                else if (typeof error === 'string') errorMessage = error;
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        }
        initializeOrganizers();
    }, []);

    const columns = useMemo<ColumnDef<Organizer>[]>(() => [
        {
            header: "Name",
            cellClassName: "font-medium text-slate-900",
            cell: (organizer) => organizer.name
        },
        {
            header: "Actions",
            headerClassName: "text-center w-24",
            cellClassName: "text-center",
            cell: (organizer) => (
                <Link 
                    to={`/organizer/edit/${organizer.organizer_id}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Edit Organizer"
                >
                    <FontAwesomeIcon icon={faPenToSquare} />
                </Link>
            )
        }
    ], []);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organizers</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage event organizers.</p>
                </div>
                <Link to="/organizer/create">
                    <Button variant="solid">Add Organizer</Button>
                </Link>
            </div>

            <DataTable 
                data={organizers}
                columns={columns}
                keyExtractor={(item) => item.organizer_id}
                loading={loading}
                searchPlaceholder="Search by organizer name..."
                emptyMessage="No organizers added yet."
                searchPredicate={(item, searchTerm) => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                }
            />
        </div>
    );
}

export default Organizers;