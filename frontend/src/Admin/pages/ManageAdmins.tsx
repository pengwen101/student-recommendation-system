import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';

import type { Admin } from "../../types";
import api from "../../api/axios";

function ManageAdmins() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const response = await api.get("/admin");
                setAdmins(response.data);
            }
            catch (error) {
                let errorMessage = "An unknown error occurred";
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                else if (typeof error === 'string') {
                    errorMessage = error;
                }
                toast.error(errorMessage);
            }
            finally {
                setLoading(false);
            }
        }
        fetchAdmins();
    }, []);

    const onApprove = async (admin_id: string) => {
        try {
            const response = await api.put(`/admin/approve/${admin_id}`);
            setAdmins(prevAdmins =>
                prevAdmins.map(admin =>
                    admin.admin_id === admin_id
                        ? response.data
                        : admin
                )
            );
            toast.success("Admin approved successfully.");
        }
        catch (error) {
            let errorMessage = "An unknown error occurred";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast.error(errorMessage);
        }
    }

    const onDelete = async (admin_id: string) => {
        try {
            await api.delete(`/admin/${admin_id}`);
            setAdmins(prevAdmins => prevAdmins.filter(admin => admin.admin_id !== admin_id));
            toast.success("Admin deleted successfully.");
        }
        catch (error) {
            let errorMessage = "An unknown error occurred";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast.error(errorMessage);
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 md:px-8 min-h-screen bg-slate-50">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Admins</h1>
                    <p className="text-slate-500 mt-2">View and approve system administrators.</p>
                </div>
                {!loading && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold shadow-sm border border-blue-100">
                        {admins.length} Total Admins
                    </div>
                )}
            </div>

            {/* Content Pane */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">Administrator Roster</h3>
                </div>

                <div className="overflow-x-auto flex-1 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                            <div className="text-slate-500 font-medium flex items-center gap-2">
                                <FontAwesomeIcon icon={faSpinner} spin /> Loading admins...
                            </div>
                        </div>
                    ) : null}

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4 font-semibold">Admin Details</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm bg-white">
                            {admins.length > 0 ? (
                                admins.map((admin) => (
                                    <tr key={admin.admin_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{admin.name}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{admin.email}</div>
                                        </td>
                                        <td className="p-4">
                                            {admin.approved ? (
                                                <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold border border-green-200 inline-block">
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200 inline-block">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!admin.approved ? (
                                                <button 
                                                    onClick={() => onApprove(admin.admin_id)} 
                                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                                                    title="Approve Admin"
                                                >
                                                    <FontAwesomeIcon icon={faCircleCheck} className="text-sm" /> 
                                                    Approve
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onDelete(admin.admin_id)}
                                                    className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-red-200"
                                                    title="Delete Admin"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                !loading && (
                                    <tr>
                                        <td colSpan={3} className="p-10 text-center text-slate-400 italic">
                                            No administrators found.
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ManageAdmins;