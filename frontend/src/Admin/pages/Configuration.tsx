import { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import type { RecommendationWeight, ResourceAssessment } from "../../types";

const RESOURCE_TYPES = ["event", "book", "article", "video"];

export default function ConfigurationDashboard() {
  const [loading, setLoading] = useState(true);

  // Global Config State
  const [studentTarget, setStudentTarget] = useState<number>(0);
  const [addScoreConstant, setAddScoreConstant] = useState<number>(1.0); // Constant for student score addition
  const [recWeight, setRecWeight] = useState<RecommendationWeight>({ need_weight: 0.5, interest_weight: 0.5 });

  // Resource Assessment State
  const [selectedType, setSelectedType] = useState<string>("event");
  const [assessments, setAssessments] = useState<ResourceAssessment[]>([]);
  
  // Form States
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newWeight, setNewWeight] = useState<number>(0);
  const [newLowerText, setNewLowerText] = useState("");
  const [newUpperText, setNewUpperText] = useState("");
  
  // Explicit Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ display_name: string; weight: number; lower_text: string; upper_text: string }>({ display_name: "", weight: 0, lower_text: "", upper_text: "" });

  // --- Fetch Data ---
  useEffect(() => {
    fetchGlobalConfigs();
  }, []);

  useEffect(() => {
    fetchAssessments(selectedType);
  }, [selectedType]);

  const fetchGlobalConfigs = async () => {
    try {
      const [targetRes, weightRes, constantRes] = await Promise.all([
        api.get("/config/student_target"),
        api.get("/config/recommendation_weight"),
        api.get("/config/add_score_constant")
      ]);
      setStudentTarget(targetRes.data.target_score || targetRes.data);
      setRecWeight(weightRes.data);
      
      // Assumes your AddScoreConstant model returns a 'weight' or similar numeric field
      setAddScoreConstant(constantRes.data.weight ?? constantRes.data ?? 1.0);
    } catch {
      toast.error("Failed to load global configurations.");
    }
  };

  const fetchAssessments = async (type: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/config/resource_assessments/${type}`);
      setAssessments(res.data);
      setEditingId(null); // Clear any active edits when switching tabs
    } catch {
      toast.error(`Failed to load assessments for ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers: Global Configs ---
  const handleSaveStudentTarget = async () => {
    try {
      await api.put(`/config/student_target?weight=${studentTarget}`);
      toast.success("Student Target updated successfully.");
    } catch {
      toast.error("Failed to update Student Target.");
    }
  };

  const handleSaveAddScoreConstant = async () => {
    try {
      // Matches: update_add_score_constant(weight: float)
      await api.put(`/config/add_score_constant?weight=${addScoreConstant}`);
      toast.success("Score Addition Multiplier updated successfully.");
    } catch {
      toast.error("Failed to update Score Addition Multiplier.");
    }
  };

  // SLIDER HANDLER
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let needVal = Number(e.target.value);
    
    // Prevent the thumb from physically moving below 0.55
    if (needVal < 0.55) {
      needVal = 0.55; 
    }

    const interestVal = Number((1.0 - needVal).toFixed(2));
    
    setRecWeight({
      need_weight: needVal,
      interest_weight: interestVal
    });
  };

  const handleSaveRecWeight = async () => {
    if (Math.abs(recWeight.need_weight + recWeight.interest_weight - 1.0) > 0.01) {
      toast.error("Recommendation weights must sum to 1.");
      return;
    }
    try {
      await api.put("/config/recommendation_weight", recWeight);
      toast.success("Recommendation Weights updated successfully.");
    } catch {
      toast.error("Failed to update Recommendation Weights.");
    }
  };

  // --- Handlers: Resource Assessments ---
  const totalAssessmentWeight = useMemo(() => {
    // Include the new item in the total if we are currently editing one, otherwise use the base list
    const activeAssessments = editingId 
      ? assessments.map(a => a.resource_assessment_id === editingId ? { ...a, weight: editData.weight } : a)
      : assessments;

    return activeAssessments.reduce((sum, item) => sum + Number(item.weight), 0);
  }, [assessments, editingId, editData.weight]);

  const handleAddAssessment = async () => {
    if (!newDisplayName.trim()) return toast.error("Display name is required.");
    if (newWeight <= 0) return toast.error("Weight must be greater than 0.");

    try {
      await api.post("/config/resource_assessments", {
        resource_type: selectedType,
        display_name: newDisplayName,
        weight: newWeight,
        lower_text: newLowerText,
        upper_text: newUpperText
      });
      toast.success("Assessment created.");
      setNewDisplayName("");
      setNewWeight(0);
      setNewLowerText("");
      setNewUpperText("");
      fetchAssessments(selectedType);
    } catch {
      toast.error("Failed to create assessment.");
    }
  };

  const startEdit = (assessment: ResourceAssessment) => {
    setEditingId(assessment.resource_assessment_id);
    setEditData({
      display_name: assessment.display_name,
      weight: assessment.weight,
      lower_text: assessment.lower_text,
      upper_text: assessment.upper_text
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editData.display_name.trim()) return toast.error("Display name cannot be empty.");

    try {
      setAssessments(prev => prev.map(a => 
        a.resource_assessment_id === id 
          ? { ...a, display_name: editData.display_name, weight: editData.weight, lower_text: editData.lower_text, upper_text: editData.upper_text } 
          : a
      ));
      
      await api.put(`/config/resource_assessments/${id}`, {
        resource_type: selectedType,
        display_name: editData.display_name,
        weight: editData.weight,
        lower_text: editData.lower_text,
        upper_text: editData.upper_text
      });
      toast.success("Assessment updated.");
      setEditingId(null);
    } catch {
      toast.error("Failed to update assessment.");
      fetchAssessments(selectedType); 
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    try {
      await api.delete(`/config/resource_assessments/${id}`);
      toast.success("Assessment deleted.");
      fetchAssessments(selectedType);
    } catch {
      toast.error("Failed to delete assessment.");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">System Configuration</h1>
        <p className="text-gray-500 mt-1">Manage global calculation weights and resource assessments.</p>
      </div>

      {/* TOP ROW: Targets & Constants */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        
        {/* Student Target Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Student Target Score</h2>
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.1"
                value={studentTarget}
                onChange={(e) => setStudentTarget(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              <button 
                onClick={handleSaveStudentTarget}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Save Target
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">The baseline mastery score students are expected to achieve.</p>
          </div>
        </div>

        {/* Add Score Constant Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Score Addition Multiplier</h2>
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.1"
                value={addScoreConstant}
                onChange={(e) => setAddScoreConstant(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              <button 
                onClick={handleSaveAddScoreConstant}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Save Constant
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">The constant multiplier applied when adding resource support scores to student mastery.</p>
          </div>
        </div>

      </div>

      {/* MIDDLE ROW: Recommendation Balance Slider */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Recommendation Engine Balance</h2>
          
          <div className="flex flex-col justify-center px-4 md:px-12 max-w-4xl mx-auto w-full">
            {/* Value Displays */}
            <div className="flex justify-between items-end mb-3">
              <div className="text-left">
                <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Need Weight</span>
                <span className="text-3xl font-bold text-gray-800">{recWeight.need_weight.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Interest Weight</span>
                <span className="text-3xl font-bold text-gray-800">{recWeight.interest_weight.toFixed(2)}</span>
              </div>
            </div>

            {/* The Range Slider */}
            <div className="relative py-4 mb-6 flex items-center">
               <div className="absolute left-0 w-full h-4 rounded-full overflow-hidden flex pointer-events-none">
                  <div className="bg-blue-500 h-full transition-all duration-200" style={{ width: `${recWeight.need_weight * 100}%` }}></div>
                  <div className="bg-purple-500 h-full transition-all duration-200" style={{ width: `${recWeight.interest_weight * 100}%` }}></div>
               </div>

               <input
                type="range"
                min="0" 
                max="1"
                step="0.05"
                value={recWeight.need_weight}
                onChange={handleSliderChange}
                className="w-full h-4 appearance-none bg-transparent cursor-pointer z-10 
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-gray-800 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg
                            [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-gray-800 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-lg"
              />
            </div>

            <button 
              onClick={handleSaveRecWeight}
              className="w-full px-6 py-3 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-900 transition-colors shadow-sm"
            >
              Save Balance Settings
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Resource Assessments Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">Resource Assessments</h2>
          
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 capitalize font-medium"
          >
            {RESOURCE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Validation Warning */}
        <div className={`mb-6 p-4 rounded-md border flex justify-between items-center transition-colors duration-300 ${Math.abs(totalAssessmentWeight - 1.0) < 0.001 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div>
            <span className="font-bold">Current Total Weight: {totalAssessmentWeight.toFixed(2)}</span>
            {Math.abs(totalAssessmentWeight - 1.0) > 0.001 && <p className="text-sm mt-0.5">The sum of all assessment weights for this resource type must equal exactly 1.0.</p>}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading assessments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="px-4 py-3 font-semibold text-gray-700 w-2/6">Display Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 w-1/6">Weight</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 w-1/6">Lower Text</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 w-1/6">Upper Text</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessments.map((item) => {
                  const isEditing = editingId === item.resource_assessment_id;
                  
                  return (
                    <tr key={item.resource_assessment_id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.display_name}
                            onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                          />
                        ) : (
                          <span className="font-medium text-gray-900 px-2 py-1.5">{item.display_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={editData.weight}
                            onChange={(e) => setEditData({ ...editData, weight: Number(e.target.value) })}
                            className="w-24 px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                          />
                        ) : (
                          <span className="font-medium text-gray-900 px-2 py-1.5">{Number(item.weight).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.lower_text}
                            onChange={(e) => setEditData({ ...editData, lower_text: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <span className="text-gray-600 px-2 py-1.5 text-sm">{item.lower_text}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.upper_text}
                            onChange={(e) => setEditData({ ...editData, upper_text: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <span className="text-gray-600 px-2 py-1.5 text-sm">{item.upper_text}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => setEditingId(null)}
                              className="text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveEdit(item.resource_assessment_id)}
                              className="text-green-600 hover:text-green-700 text-sm font-semibold transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={() => startEdit(item)}
                              className="text-blue-500 hover:text-blue-700 text-sm font-semibold transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteAssessment(item.resource_assessment_id)}
                              className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Add New Row */}
                {editingId === null && (
                  <tr className="bg-blue-50/30">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="New Display Name..."
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        placeholder="0.0"
                        value={newWeight || ''}
                        onChange={(e) => setNewWeight(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Lower text..."
                        value={newLowerText}
                        onChange={(e) => setNewLowerText(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Upper text..."
                        value={newUpperText}
                        onChange={(e) => setNewUpperText(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={handleAddAssessment}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}