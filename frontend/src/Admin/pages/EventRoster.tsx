import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Pane } from '../../components/Pane';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faUpload, 
  faFileCsv, 
  faSpinner, 
  faDownload, 
  faChevronLeft, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';
import api from "../../api/axios"; 
import toast from "react-hot-toast";

// --- Types ---
interface AttendedStudent {
  nrp: string;
  full_name: string;
  major: string;
}

export default function EventRoster() {
  const { resource_id } = useParams<{ resource_id: string }>();
  
  // Table State
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<AttendedStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [resourceTitle, setResourceTitle] = useState<string>("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Bulk Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH STUDENTS ---
  const fetchStudents = async () => {
    if (!resource_id) return;
    
    try {
      setIsLoadingStudents(true);
      const res = await api.get(`/student/attendance/${resource_id}`);
      setStudents(res.data);
    } catch (error: any) {
      toast.error("Failed to load registered students.");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    if (resource_id) {
      api.get(`/resource/${resource_id}`).then(res => {
        setResourceTitle(res.data.resource_details?.title || resource_id);
      }).catch(() => {
        setResourceTitle(resource_id);
      });
    }
  }, [resource_id]);

  // --- HANDLERS: Bulk Import ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validExtensions = ['.csv', '.xls', '.xlsx'];
      const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValid) {
        toast.error("Please upload a valid CSV or Excel file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }
    if (!resource_id) {
      toast.error("Resource ID is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      
      const response = await api.post(`/student/attendance/${resource_id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(response.data.message || "Attendance recorded successfully!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await fetchStudents();
      setCurrentPage(1); // Reset to first page after upload
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "An error occurred during upload.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "nrp\n5025201001\n5025201002\n5025201003";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendance_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- HANDLERS: Delete All ---
  const handleDeleteAll = async () => {
    if (!resource_id) return;
    
    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete ALL registered students? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoadingStudents(true);
      // Backend expects no nrp parameter to delete all
      await api.delete(`/student/attendance/${resource_id}`);
      toast.success("All students removed from the roster.");
      setStudents([]);
      setCurrentPage(1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to delete students.";
      toast.error(errorMessage);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // --- HANDLERS: Delete Single Student ---
  const handleDeleteStudent = async (nrp: string) => {
    if (!resource_id) return;
    
    if (!window.confirm(`Are you sure you want to remove student ${nrp}?`)) {
      return;
    }

    try {
      setIsLoadingStudents(true);
      // Pass the NRP as a query parameter to target a specific student
      await api.delete(`/student/attendance/${resource_id}?nrp=${nrp}`);
      toast.success(`Student ${nrp} removed successfully.`);
      
      // Update local state instead of doing a full refetch for better performance
      setStudents(prev => prev.filter(s => s.nrp !== nrp));
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to remove student.";
      toast.error(errorMessage);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // --- FILTER & PAGINATION LOGIC ---
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nrp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  
  // Ensure we don't get stuck on an empty page after deleting
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredStudents.length, currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Context */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Event Roster</h1>
          <p className="text-sm text-slate-500 mt-1">{resourceTitle}</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold shadow-sm border border-blue-100">
          {students.length} Registered
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Bulk Import Only */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Pane variant="shadow" className="p-6 border-dashed border-2 border-slate-200">
            <div className="text-center flex flex-col items-center gap-3">
              <div className="bg-slate-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faUpload} className="text-slate-500 text-xl" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900">Bulk Import</h3>
                <p className="text-xs text-slate-500 mt-1">Upload a CSV or Excel file containing student NRPs.</p>
              </div>

              {/* Hidden File Input */}
              <input 
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="w-full mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-800 rounded text-sm border border-blue-100">
                    <FontAwesomeIcon icon={faFileCsv} className="text-blue-500" />
                    <span className="truncate font-medium flex-1 text-left">{selectedFile.name}</span>
                    <button 
                      onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  <Button 
                    variant="solid" 
                    className="w-full flex justify-center items-center gap-2" 
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Upload Attendance"}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              )}

              <button 
                onClick={downloadTemplate}
                className="text-xs text-blue-600 font-medium hover:underline mt-2 flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faDownload} /> Download CSV Template
              </button>
            </div>
          </Pane>
        </div>

        {/* RIGHT COLUMN: The Roster Table */}
        <div className="lg:col-span-2">
          <Pane variant="shadow" className="p-0 overflow-hidden h-full flex flex-col min-h-[400px]">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Registered Students</h3>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {students.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeleteAll}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-1.5" /> Delete All
                  </Button>
                )}
                <div className="w-full sm:w-64">
                  <Input 
                    type="text" 
                    placeholder="Search NRP or Name..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to page 1 on search
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1 relative">
              {isLoadingStudents ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                  <div className="text-slate-500 font-medium flex items-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} spin /> Loading roster...
                  </div>
                </div>
              ) : null}

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Major</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student) => (
                      <tr key={student.nrp} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{student.full_name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">NRP: {student.nrp}</div>
                        </td>
                        <td className="p-4 text-slate-700">{student.major}</td>
                        <td className="p-4">
                          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold border border-green-200 inline-block">
                            Attended
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteStudent(student.nrp)}
                            className="text-slate-400 hover:text-red-600 p-2 transition-colors" 
                            title="Remove student"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    !isLoadingStudents && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400 italic">
                          {searchTerm ? "No students found matching your search." : "No students have been recorded yet."}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)}</span> of <span className="font-semibold text-slate-900">{filteredStudents.length}</span> students
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>
                  <span className="text-slate-700 font-medium px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </Pane>
        </div>

      </div>
    </div>
  );
}