import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import type { Resource, SubCpl, Topic } from "../../types";
import api from "../../api/axios";

function ResourceForm() {
  // Hooks
  const { resource_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [subCpls, setSubCpls] = useState<SubCpl[] | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [activating, setActivating] = useState(false);
  const isEdit = location.pathname.includes("/edit");

   useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get("/users/me");

        if (!userRes.data.authenticated) {
          window.location.href = "/admin/login";
          return;
        }

        const subcpls = await api.get("/subcpl");
        const topics = await api.get("/topic");
        setSubCpls(subcpls.data.subcpls);
        setTopics(topics.data.topics);  

        if (isEdit && resource_id) {
          const res = await api.get(`/resource/${resource_id}`);
          setResource(res.data.resource_details || null);
        } else {
          setResource({
            resource_id: "",
            type: "event",
            name: "",
            description: "",
            start_datetime: "2026-03-08T00:00:00Z",
            end_datetime: "2026-03-09T00:00:00Z",
            status: "open",
            is_active: true,
            subcpls: [],
            topics: []
          } as Resource);
        }
      } catch {
        toast.error("Failed to load resource");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resource_id, isEdit]);

  const getDateOnly = (isoString?: string) => {
    if (!isoString) return "";
    return isoString.split('T')[0];
  };

  const getTimeOnly = (isoString?: string) => {
    if (!isoString) return "";
    return isoString.split('T')[1].substring(0, 5); 
  };

  // Handle change functions
  const handleDateChange = (type: 'start' | 'end', field: 'date' | 'time', value: string) => {
    if (!resource) return;
    
    const targetField = type === 'start' ? 'start_datetime' : 'end_datetime';
    const currentIso = resource[targetField] || "2026-01-01T00:00:00Z";
    
    let [currentDate, currentTime] = currentIso.split('T');
    
    if (field === 'date') currentDate = value;
    if (field === 'time') currentTime = value + ":00Z";

    setResource({
      ...resource,
      [targetField]: `${currentDate}T${currentTime}`
    });
  };

  const handleSubCplToggle = (subCplId: string) => {
    if (!resource) return;
    const existingSubCpls = resource.subcpls || [];
    const hasSubCpl = existingSubCpls.some(s => s.sub_cpl_id === subCplId);

    let newSubCpls;
    if (hasSubCpl) {
      newSubCpls = existingSubCpls.filter(s => s.sub_cpl_id !== subCplId);
    } else {
      const masterSubCpl = subCpls?.find(s => s.sub_cpl_id === subCplId);
      if (!masterSubCpl) return;
      
      newSubCpls = [
        ...existingSubCpls,
        {
          sub_cpl_id: subCplId,
          code: masterSubCpl.code,
          name: masterSubCpl.name,
          qualities: masterSubCpl.qualities
        }
      ];
    }
    setResource({ ...resource, subcpls: newSubCpls });
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!resource) return;

    const { name, value } = event.target;

    setResource({
      ...resource,
      [name]: value
    });
  };

  const handleQualityToggle = (subCplId: string, qualityId: string) => {
    if (!resource) return;
    const existingSubCpls = resource.subcpls || [];
    
    const hasSubCpl = existingSubCpls.some(s => s.sub_cpl_id === subCplId);
    let newSubCpls;

    if (!hasSubCpl) {
      const masterSubCpl = subCpls?.find(s => s.sub_cpl_id === subCplId);
      if (!masterSubCpl) return;
      const masterQuality = masterSubCpl.qualities.find(q => q.quality_id === qualityId);
      if (!masterQuality) return;

      newSubCpls = [
        ...existingSubCpls, 
        { 
           sub_cpl_id: subCplId, 
           code: masterSubCpl.code,
           name: masterSubCpl.name,
           qualities: [masterQuality]
        }
      ];
    } else {
      newSubCpls = existingSubCpls.map(subcpl => {
        if (subcpl.sub_cpl_id !== subCplId) return subcpl;

        const hasQuality = subcpl.qualities.some(q => q.quality_id === qualityId);
        let newQualities;
        
        if (hasQuality) {
           newQualities = subcpl.qualities.filter(q => q.quality_id !== qualityId);
        } else {
           const masterSubCpl = subCpls?.find(s => s.sub_cpl_id === subCplId);
           const masterQuality = masterSubCpl?.qualities.find(q => q.quality_id === qualityId);
           
           if (masterQuality) {
               newQualities = [...subcpl.qualities, masterQuality];
           } else {
               newQualities = subcpl.qualities;
           }
        }
        return { ...subcpl, qualities: newQualities };
      }).filter(s => s.qualities.length > 0);
    }

    
    setResource({ ...resource, subcpls: newSubCpls });
  };

  const handleTopicToggle = (topic_id: string) => {
    if (!resource) return;
    const existingTopics = resource.topics || [];
    
    const hasTopic = existingTopics.some(t => t.topic_id === topic_id);

    let newTopics;
    if (hasTopic) {
      newTopics = existingTopics.filter(t => t.topic_id !== topic_id);
    } else {
      const masterTopic = topics?.find(t => t.topic_id === topic_id);
      if (!masterTopic) return;

      newTopics = [
          ...existingTopics, 
          { 
              topic_id: topic_id, 
              code: masterTopic.code,
              name: masterTopic.name,
              weight: 1 
          }
      ]; 
    }
    setResource({ ...resource, topics: newTopics });
  };

  const handleTopicWeightChange = (topic_id: string, newWeight: number) => {
    if (!resource) return;
    
    const newTopics = (resource.topics || []).map(t =>
      t.topic_id === topic_id ? { ...t, weight: newWeight } : t
    );
    
    setResource({ ...resource, topics: newTopics });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resource) return;

    setSubmitting(true);

    const resource_input = {
      type: resource.type,
      name: resource.name,
      description: resource.description,
      start_datetime: resource.start_datetime,
      end_datetime: resource.end_datetime,
      status: resource.status,

      subcpls: resource.subcpls?.map((subcpl) => ({
        sub_cpl_id: subcpl.sub_cpl_id,
        qualities: subcpl.qualities.map((quality) => ({
            quality_id: quality.quality_id
        }))
      })),

      topics: resource.topics?.map((topic) => ({
        topic_id: topic.topic_id,
        weight: topic.weight,
      }))
    };

    try {
      if (isEdit) {
        await api.put(`/resource/${resource.resource_id}`, resource_input);
      } else {
        await api.post("/resource", resource_input);
      }

      navigate("/resource", {
        state: { successMessage: "Resource saved successfully" }
      });

    } catch (error) {
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const onDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDeleting(true);
    try {
      const response = await api.delete(`/resource/${resource?.resource_id}`);
      navigate("/resource", {
        state: { successMessage: response.data.message }
      });
    } catch {
      toast.error("Failed to delete resource");
    } finally {
      setDeleting(false);
    }
  }

  const onArchive = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setArchiving(true);
    try {
      const response = await api.put(`/resource/archive/${resource?.resource_id}`);
      navigate("/resource", {
        state: { successMessage: response.data.message }
      });
    } catch {
      toast.error("Failed to archive resource");
    } finally {
      setArchiving(false);
    }
  }

    const onActivate = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setActivating(true);
    try {
      const response = await api.put(`/resource/activate/${resource?.resource_id}`);
      navigate("/resource", {
        state: { successMessage: response.data.message }
      });
    } catch {
      toast.error("Failed to activate resource");
    } finally {
      setActivating(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="text-2xl mb-4">
        {isEdit ? "Edit Resource" : "Create Resource"}
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4 w-5/6">

          <label>Name</label>
          <input
            type="text"
            name="name"
            value={resource?.name || ""}
            onChange={onChange}
            className="border p-2"
          />

          <label>Type</label>
          <select name="type" onChange={onChange} value={resource?.type || ""} className="border p-2 text-white bg-gray-900">
            <option value="event">Event</option>
            <option value="book">Book</option>
            <option value="video">Video</option>
          </select>

          <label>Description</label>
          <input
            type="textarea"
            name="description"
            value={resource?.description || ""}
            onChange={onChange}
            className="border p-2"
          />

          <label>Start Date</label>
          <input
            type="date"
            name="start_date"
            value={getDateOnly(resource?.start_datetime) || ""}
            onChange={(e) => handleDateChange('start', 'date', e.target.value)}
            className="border p-2"
          />

          <label>Start Time</label>
          <input
            type="time"
            name="start_time"
            value={getTimeOnly(resource?.start_datetime) || ""}
            onChange={(e) => handleDateChange('start', 'time', e.target.value)}
            className="border p-2"
          />

          <label>End Date</label>
          <input
            type="date"
            name="end_date"
            value={getDateOnly(resource?.end_datetime) || ""}
            onChange={(e) => handleDateChange('end', 'date', e.target.value)}
            className="border p-2"
          />

          <label>End Time</label>
          <input
            type="time"
            name="end_time"
            value={getTimeOnly(resource?.end_datetime) || ""}
            onChange={(e) => handleDateChange('end', 'time', e.target.value)}
            className="border p-2"
          />

          <div className="col-span-2 p-4 border rounded shadow-sm bg-white">
            <h3 className="text-lg text-gray-900 font-bold mb-4">Sub-CPLs & Qualities</h3>
            <p className="text-sm text-gray-500 mb-4">Check a Sub-CPL to reveal its qualities.</p>
            
            <div className="space-y-4">
              {subCpls?.map(subcpl => {
                const isSubCplSelected = resource?.subcpls?.some(s => s.sub_cpl_id === subcpl.sub_cpl_id);

                return (
                  <div key={subcpl.sub_cpl_id} className={`border p-3 rounded transition-colors ${isSubCplSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <label className="flex items-center gap-3 font-bold text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSubCplSelected || false}
                        onChange={() => handleSubCplToggle(subcpl.sub_cpl_id)}
                        className="w-5 h-5 cursor-pointer text-blue-600 rounded"
                      />
                      {subcpl.code} | {subcpl.name}
                    </label>

                    {isSubCplSelected && (
                      <div className="mt-4 ml-8 p-4 bg-white border border-blue-100 rounded shadow-inner">
                        <h4 className="font-semibold text-sm text-blue-800 mb-3">Select Qualities:</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {subcpl.qualities?.map(q => {
                            const isQualityChecked = resource?.subcpls?.find(
                              s => s.sub_cpl_id === subcpl.sub_cpl_id
                            )?.qualities.some(resourceQ => resourceQ.quality_id === q.quality_id) || false;

                            return (
                              <label key={q.quality_id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                   type="checkbox"
                                   checked={isQualityChecked}
                                   onChange={() => handleQualityToggle(subcpl.sub_cpl_id, q.quality_id)}
                                   className="w-4 h-4 text-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">{q.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="col-span-2 p-4 border rounded shadow-sm">
            <h3 className="text-lg font-bold mb-4">Topics & Weights</h3>
            
            <div className="space-y-3">
              {topics?.map(topic => {
                const attachedTopic = resource?.topics?.find(t => t.topic_id === topic.topic_id);
                const isSelected = !!attachedTopic;

                return (
                  <div key={topic.topic_id} className="flex items-center gap-4 p-3 border rounded">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleTopicToggle(topic.topic_id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="font-medium w-1/3">{topic.name}</span>

                    {isSelected && attachedTopic && (
                      <div className="flex-1 flex items-center gap-4">
                        <span className="text-sm text-gray-500">Weight:</span>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={attachedTopic.weight*10}
                          onChange={(e) => handleTopicWeightChange(topic.topic_id, parseFloat(e.target.value)/10)}
                          className="flex-1 cursor-pointer"
                        />
                        <span className="font-bold text-blue-600 w-6 text-center">
                          {attachedTopic.weight}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 bg-blue-500 px-4 py-2 rounded">
          {submitting ? "Saving..." : "Save"}
        </button>
      </form>

      <button onClick={onDelete} disabled={deleting}
          className="mt-4 bg-red-500 px-4 py-2 rounded">
          Delete
      </button>
      
      {resource?.is_active ? (
        <button onClick={onArchive} disabled={archiving}
          className="mt-4 bg-red-500 px-4 py-2 rounded">
          Archive
        </button>
        ) : (
        <button onClick={onActivate} disabled={activating}
          className="mt-4 bg-green-500 px-4 py-2 rounded">
          Activate
        </button>
        )
      }
    </>
  );
}

export default ResourceForm;