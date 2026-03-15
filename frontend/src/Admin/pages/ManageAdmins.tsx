import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';

import type { Admin } from "../../types";
import api from "../../api/axios";

function ManageAdmins(){
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const response = await api.get("/admin");
                setAdmins(response.data.admins);
            }
            catch (error){
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
    }, [])

    const onApprove = async (admin_id: string) => {
        try {
            const response = await api.put(`/admin/approve/${admin_id}`);
            setAdmins(prevAdmins =>
                prevAdmins.map(admin =>
                    admin.admin_id === admin_id
                        ? response.data.admin_details
                        : admin
                )
            );
            toast.success("Admin approved successfully.");
        }
        catch (error){
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
        <>
            <div className="text-2xl mb-4">Admins</div>
            <Link to="/admin/create"><button className="bg-blue-500 text-white">Add Admin</button></Link>
            {loading ? (<div className="text-sm text-gray-500 mt-4 animate-pulse">Loading admins...</div>) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200 m-8">
                <table className="table-auto w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Name</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-800">
                        {admins.map((admin) => (
                            <tr key={admin.admin_id} className="border-b border-gray-100 hover:bg-gray-200 transition-colors">
                                <td className="px-6 py-4 font-medium">{admin.email}</td>
                                <td className="px-6 py-4 text-gray-500">{admin.name}</td>
                                {admin.approved ? (<td className="px-6 py-4"></td>) : (
                                <td className="px-6 py-4"><FontAwesomeIcon className="cursor-pointer" onClick={() => onApprove(admin.admin_id)} icon={faCircleCheck} /></td>)
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>)
            }
        </>
    )
}

export default ManageAdmins;