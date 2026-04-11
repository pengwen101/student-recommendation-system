import { useState } from "react";
import { Pane } from '../../components/Pane';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTrash, faUpload, faUserPlus } from '@fortawesome/free-solid-svg-icons';

export default function EventRoster() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Context */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Event Roster</h1>
          <p className="text-sm text-slate-500 mt-1">Intro to Advanced Robotics • Oct 15, 2026</p>
        </div>
        <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg font-bold">
          45 / 100 Registered
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Add Students */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Pane variant="shadow" className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Add</h3>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700">Search Student ID or Name</label>
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="e.g. 1201920..." 
                  className="pl-10"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-slate-400" />
              </div>
              {/* This would normally be an absolute positioned dropdown of search results */}
              <Button className="w-full mt-2" variant="primary">
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> Add Student
              </Button>
            </div>
          </Pane>

          <Pane variant="shadow" className="p-6 border-dashed border-2 border-slate-200">
            <div className="text-center flex flex-col items-center gap-3">
              <div className="bg-slate-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faUpload} className="text-slate-500 text-xl" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900">Bulk Import</h3>
                <p className="text-xs text-slate-500 mt-1">Upload a CSV containing Student IDs.</p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
            </div>
          </Pane>
        </div>

        {/* RIGHT COLUMN: The Roster Table */}
        <div className="lg:col-span-2">
          <Pane variant="shadow" className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Registered Students</h3>
              <div className="w-64">
                <Input type="text" placeholder="Filter list..." size="sm" />
              </div>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Major</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {/* Example Row */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">Budi Santoso</div>
                    <div className="text-slate-500 text-xs">ID: 5025201001</div>
                  </td>
                  <td className="p-4 text-slate-700">Informatics</td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                      Registered
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-danger-600 p-2">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </Pane>
        </div>

      </div>
    </div>
  );
}