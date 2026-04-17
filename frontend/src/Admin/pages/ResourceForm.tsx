import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import type { ResourceInput, SubCpl, Topic, Organizer } from "../../types";
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Pane } from '../../components/Pane';
import { Textarea } from '../../components/Textarea';
import api from "../../api/axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

function ResourceForm() {
  // Hooks
  const { resource_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceInput | null>(null);
  const [subCpls, setSubCpls] = useState<SubCpl[] | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[] | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = location.pathname.includes("/edit");

   useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get("/users/me");

        if (!userRes.data.authenticated) {
          window.location.href = "/admin/login";
          return;
        }

        const subcpls = await api.get("/subcpl/indicators");
        const topics = await api.get("/topic");
        const organizers = await api.get("/organizer");
        setSubCpls(subcpls.data.subcpls);
        setTopics(topics.data.topics);
        setOrganizers(organizers.data.organizers);

        if (isEdit && resource_id) {
          const res = await api.get(`/resource/${resource_id}`);
          setResource(res.data.resource_details || null);
        } else {
          setResource({
            resource_id: "",
            type: "event",
            name: "",
            description: "",
            sessions: [],
            scale: "university",
            speaker_degree: "bachelor",
            status: "",
            is_active: true,
            subcpls: [],
            topics: []
          } as ResourceInput);
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

  const handleAddSession = () => {
      setResource(prev => {
        if (!prev) return prev;
        
        return {
            ...prev,
            sessions: [
                ...(prev.sessions || []), 
                { session_id: "", start_datetime: "", end_datetime: "" }
            ]
        };
      });
  };

  const handleAddOrganizer = () => {
      setResource(prev => {
        if (!prev) return prev;
        
        return {
            ...prev,
            organizers: [
                ...(prev.organizers || []), 
                { organizer_id: "" }
            ]
        };
      });
  };

  const handleRemoveSession = (indexToRemove: number) => {
      setResource(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          sessions: prev.sessions?.filter((_, index) => index !== indexToRemove)
        };
      });
  };

  const handleRemoveOrganizer = (indexToRemove: number) => {
      setResource(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          organizers: prev.organizers?.filter((_, index) => index !== indexToRemove)
        };
      });
  };


  const handleSessionChange = (index: number, field: string, type: string, value: string) => {
      const updatedSessions = [...(resource?.sessions || [])];
      const session = { ...updatedSessions[index] };
    
      const targetField = field === 'start' ? 'start_datetime' : 'end_datetime';
    
      const currentDate = getDateOnly(session[targetField]) || "";
      const currentTime = getTimeOnly(session[targetField]) || "00:00";

      let newDateTimeStr = "";
      if (type === 'date') {
          newDateTimeStr = value ? `${value}T${currentTime}:00` : "";
      } else if (type === 'time') {
          newDateTimeStr = currentDate ? `${currentDate}T${value}:00` : "";
      }

      session[targetField] = newDateTimeStr;
      updatedSessions[index] = session;

      const updatedResource = { ...resource, sessions: updatedSessions } as ResourceInput;
      setResource(updatedResource);
      const newErrors = { ...errors };

      if (updatedResource.type === 'event') {
        if (!updatedSessions || updatedSessions.length === 0) {
          newErrors.sessions = "Events must have at least one session.";
        } else {
          delete newErrors.sessions; 

          updatedSessions.forEach((sess, idx) => {
            if (!sess.start_datetime) {
                newErrors[`session_${idx}_start`] = "Start date and time required.";
            } else {
                delete newErrors[`session_${idx}_start`];
            }
   
            if (!sess.end_datetime) {
                newErrors[`session_${idx}_end`] = "End date and time required.";
            } else if (sess.start_datetime && new Date(sess.end_datetime) <= new Date(sess.start_datetime)) {
                newErrors[`session_${idx}_end`] = "End time must be after start time.";
            } else {
                delete newErrors[`session_${idx}_end`];
            }
          });
        }
      }

      setErrors(newErrors);
  };

  const handleOrganizerChange = (index: number, value: string) => {
      const updatedOrganizers = [...(resource?.organizers || [])];
      const organizer = { ...updatedOrganizers[index] };

      organizer["organizer_id"] = value;
      updatedOrganizers[index] = organizer;

      const updatedResource = { ...resource, organizers: updatedOrganizers } as ResourceInput;
      setResource(updatedResource);
      const newErrors = { ...errors };

      if (updatedResource.type === 'event') {
        if (!updatedOrganizers || updatedOrganizers.length === 0) {
          newErrors.organizers = "Events must have an organizer.";
        } else {
          delete newErrors.organizers;
        }
      }

      setErrors(newErrors);
  };

  const handleSubCplToggle = (subCplId: string) => {
    if (!resource) return;
    const existingSubCpls = resource.subcpls || [];
    const hasSubCpl = existingSubCpls.some(s => s.sub_cpl_id === subCplId);

    let newSubCpls;
    if (hasSubCpl) {
      const subCplToRemove = existingSubCpls.find(s => s.sub_cpl_id === subCplId);
      const indicatorsToUntick = subCplToRemove?.indicators.map(i => i.indicator_id) || [];

      newSubCpls = existingSubCpls.filter(s => s.sub_cpl_id !== subCplId);

      if (indicatorsToUntick.length > 0) {
        newSubCpls = newSubCpls.map(subcpl => {
          return {
            ...subcpl,
            indicators: subcpl.indicators.filter(i => !indicatorsToUntick.includes(i.indicator_id))
          };
        }).filter(subcpl => subcpl.indicators.length > 0);
      }
    } else {
      newSubCpls = [
        ...existingSubCpls,
        {
          sub_cpl_id: subCplId,
          indicators: []
        }
      ];
    }
    setResource({ ...resource, subcpls: newSubCpls });

    const newErrors = { ...errors };

    if (newSubCpls.length == 0 || newSubCpls[0]?.indicators.length == 0) {
      newErrors.subcpls = "At least one Sub-CPL and one Indicator must be selected.";
    } else {
      delete newErrors.subcpls;
    }

    setErrors(newErrors);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!resource) return;

    const { name, value } = event.target;

    setResource( {
      ...resource,
      [name]: value
    });

    const newErrors = { ...errors };
    if (name === "name") {
      if (value.trim()) {
        delete newErrors.name;
      } else {
        newErrors.name = "Name is required.";
      }
    }

    if (name === "description") {
      if (value.trim()) {
        delete newErrors.description;
      } else {
        newErrors.description = "Description is required.";
      }
    }

    setErrors(newErrors);
  };

  const handleIndicatorToggle = (clickedSubCplId: string, indicatorId: string) => {
    if (!resource || !subCpls) return;

    const existingSubCpls = resource.subcpls || [];

    const clickedSubCpl = existingSubCpls.find(s => s.sub_cpl_id === clickedSubCplId);
    const isCurrentlyTicked = clickedSubCpl?.indicators.some(i => i.indicator_id === indicatorId);

    const isTicking = !isCurrentlyTicked;

    const affectedSubCplIds = subCpls
      .filter(subcpl => subcpl.indicators.some(ind => ind.indicator_id === indicatorId))
      .map(subcpl => subcpl.sub_cpl_id);

    let newSubCpls = [...existingSubCpls];

    if (isTicking) {
      affectedSubCplIds.forEach(targetSubCplId => {
        const existingIndex = newSubCpls.findIndex(s => s.sub_cpl_id === targetSubCplId);
        
        if (existingIndex >= 0) {
          const hasIndicator = newSubCpls[existingIndex].indicators.some(i => i.indicator_id === indicatorId);
          if (!hasIndicator) {
            newSubCpls[existingIndex] = {
              ...newSubCpls[existingIndex],
              indicators: [...newSubCpls[existingIndex].indicators, { indicator_id: indicatorId }]
            };
          }
        } else {
          newSubCpls.push({
            sub_cpl_id: targetSubCplId,
            indicators: [{ indicator_id: indicatorId }]
          });
        }
      });
    } else {
      newSubCpls = newSubCpls.map(subcpl => {
        if (affectedSubCplIds.includes(subcpl.sub_cpl_id)) {
          return {
            ...subcpl,
            indicators: subcpl.indicators.filter(i => i.indicator_id !== indicatorId)
          };
        }
        return subcpl;
      }).filter(subcpl => subcpl.indicators.length > 0);
    }

    setResource({ ...resource, subcpls: newSubCpls });

    const newErrors = { ...errors };
    if (newSubCpls.length === 0) {
      newErrors.subcpls = "At least one Sub-CPL and one Indicator must be selected.";
    } else {
      delete newErrors.subcpls;
    }
    setErrors(newErrors);
  };

  const handleTopicToggle = (topic_id: string) => {
    if (!resource) return;
    const existingTopics = resource.topics || [];
    
    const hasTopic = existingTopics.some(t => t.topic_id === topic_id);

    let newTopics;
    if (hasTopic) {
      newTopics = existingTopics.filter(t => t.topic_id !== topic_id);
    } else {
      newTopics = [
          ...existingTopics, 
          { 
              topic_id: topic_id,
          }
      ]; 
    }
    setResource({ ...resource, topics: newTopics });

    const newErrors = { ...errors };

    if (newTopics.length == 0) {
      newErrors.topics = "At least one Topic must be selected.";
    } else {
      delete newErrors.topics;
    }

    setErrors(newErrors);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resource) return;
    const newErrors: Record<string, string> = {};

    if (!resource.name?.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!resource.description?.trim()) {
      newErrors.description = "Description is required.";
    }

    if (resource.subcpls.length == 0 || resource.subcpls[0].indicators.length == 0) {
      newErrors.subcpls = "At least one Sub-CPL and one Indicator must be selected.";
    }

    if (resource.topics.length == 0) {
      newErrors.topics = "At least one topic must be selected.";
    }

    if (resource.type === 'event') {
      if (!resource.sessions || resource.sessions.length === 0) {
        newErrors.sessions = "Events must have at least one session.";
      } else {
        resource.sessions.forEach((session, index) => {
          if (!session.start_datetime) {
              newErrors[`session_${index}_start`] = "Start date and time required.";
          }
          if (!session.end_datetime) {
              newErrors[`session_${index}_end`] = "End date and time required.";
          } 
          else if (session.start_datetime && new Date(session.end_datetime) <= new Date(session.start_datetime)) {
              newErrors[`session_${index}_end`] = "End time must be after start time.";
          }
        });
      }

      if (!resource?.organizers || resource?.organizers?.length === 0){
        newErrors.organizers = "Events must have an organizer."
      }
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fix the highlighted errors in the form."); 
        return; 
    }

    setErrors({});
    setSubmitting(true);

    let computedStatus;

    if (resource.type === 'event' && resource.sessions && resource.sessions.length > 0) {
      const now = new Date().getTime();
      const earliestStart = Math.min(...resource.sessions.map(s => new Date(s.start_datetime).getTime()));
      const latestEnd = Math.max(...resource.sessions.map(s => new Date(s.end_datetime).getTime()));

      if (now > latestEnd) {
        computedStatus = "completed";
      } else if (now >= earliestStart) {
        computedStatus = "ongoing";
      } else {
        computedStatus = "open";
      }
    }

    const resource_input = {
      type: resource.type,
      name: resource.name,
      description: resource.description,
      ...(resource.type === 'event' && computedStatus ? { status: computedStatus } : {}),
      ...(resource.type === 'event' && resource.scale ? { scale: resource.scale } : {}),
      ...(resource.type === 'event' && resource.organizers ? { organizers: resource.organizers } : {}),
      ...(resource.type === 'event' && resource.speaker_degree && resource.speaker_degree !== "no_speaker" ? { speaker_degree: resource.speaker_degree } : {}),

      ...(resource.type === 'event' ? {
        sessions: (resource.sessions || []).map((session) => ({
          ...(session.session_id ? { session_id: session.session_id } : {}),
          start_datetime: session.start_datetime,
          end_datetime: session.end_datetime
        }))
      } : {}),

      subcpls: resource.subcpls,
      topics: resource.topics
    };

    console.log(resource_input);

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
  <div className="max-w-4xl mx-auto pb-12">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        {isEdit ? "Edit Resource" : "Create Resource"}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Configure the details, schedule, and curriculum mapping.
      </p>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      
      {/* SECTION 1: Basic Details */}
      <Pane variant="shadow" className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Basic Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <Input
              type="text"
              name="name"
              placeholder="e.g. Intro to Advanced Robotics"
              value={resource?.name || ""}
              onChange={onChange}
            />
            {errors.name && (
              <span className="text-xs font-medium text-red-600 mt-1">
                {errors.name}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Type</label>
            <Select name="type" onChange={onChange} value={resource?.type || ""}>
              <option value="event">Event</option>
              <option value="book">Book</option>
              <option value="video">Video</option>
            </Select>
            {errors.type && (
              <span className="text-xs font-medium text-red-600 mt-1">
                {errors.type}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 md:col-span-3">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <Textarea
              name="description"
              placeholder="Provide a brief overview of this resource..."
              value={resource?.description || ""}
              onChange={onChange}
            />
            {errors.description && (
              <span className="text-xs font-medium text-red-600 mt-1">
                {errors.description}
              </span>
            )}
          </div>
        </div>

        { resource?.type == 'event' && (
        <>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="flex flex-col gap-2 md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Scale</label>
            <Select name="scale" value={resource?.scale || ""} onChange={onChange}>
              <option value="university">University</option>
              <option value="regional">Regional</option>
              <option value="national">National</option>
              <option value="international">International</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Speaker's Degree</label>
            <Select name="speaker_degree" value={resource?.speaker_degree || ""} onChange={onChange}>
              <option value="no_speaker">No Speaker</option>
              <option value="university_student">University Student</option>
              <option value="bachelor">Bachelor</option>
              <option value="master">Master</option>
              <option value="phd">Phd</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="text-base font-bold text-slate-900">Event Organizers</h4>
              <p className="text-sm text-slate-500">Select organizer(s) of this event.</p>
            </div>
            <Button 
              type="button" 
              onClick={handleAddOrganizer} 
              variant="outline" 
              size="sm"
              className="text-primary-700 border-primary-200 hover:bg-primary-50"
            >
              + Add Organizer
            </Button>
          </div>
          {errors.organizers && (
            <span className="text-xs font-medium text-red-600 mt-1">{errors.organizers}</span>
          )}
          {resource?.organizers?.map((organizer, index) => (
            <div 
              key={index} 
              className="flex flex-col gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-slate-300"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Organizer {index + 1}
                </span>
                
                {/* Only show delete button if there is more than 1 session */}
                {resource.organizers && resource.organizers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOrganizer(index)}
                    className="text-slate-400 hover:text-danger-600 transition-colors p-1"
                    title="Remove Organizer"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Organizer</label>
                <Select name="organizer" value={organizer.organizer_id || ""} onChange={ (e) => {handleOrganizerChange(index, e.target.value)}}>
                  <option value="" disabled>Select an organizer...</option>
                  { organizers?.map((organizer) => (
                    <option value={organizer.organizer_id}>{organizer.name.charAt(0).toUpperCase() + organizer.name.slice(1)}</option>
                  ))
                  }
                </Select>
              </div>
              
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="text-base font-bold text-slate-900">Event Sessions</h4>
              <p className="text-sm text-slate-500">Add multiple days or time blocks for this event.</p>
            </div>
            <Button 
              type="button" 
              onClick={handleAddSession} 
              variant="outline" 
              size="sm"
              className="text-primary-700 border-primary-200 hover:bg-primary-50"
            >
              + Add Session
            </Button>
          </div>
          {errors.sessions && (
            <span className="text-xs font-medium text-red-600 mt-1">{errors.sessions}</span>
          )}
          {resource?.sessions?.map((session, index) => (
            <div 
              key={index} 
              className="flex flex-col gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-slate-300"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Session {index + 1}
                </span>
                
                {/* Only show delete button if there is more than 1 session */}
                {resource.sessions && resource.sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(index)}
                    className="text-slate-400 hover:text-danger-600 transition-colors p-1"
                    title="Remove Session"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600">Starts At</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      className="flex-1 bg-white"
                      value={getDateOnly(session.start_datetime) || ""}
                      onChange={(e) => handleSessionChange(index, 'start', 'date', e.target.value)}
                      required
                    />
                    <Input
                      type="time"
                      className="w-32 bg-white"
                      value={getTimeOnly(session.start_datetime) || ""}
                      onChange={(e) => handleSessionChange(index, 'start', 'time', e.target.value)}
                      required
                    />
                  </div>
                   {errors[`session_${index}_start`] && (
                      <span className="text-xs font-medium text-red-600">{errors[`session_${index}_start`]}</span>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600">Ends At</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      className="flex-1 bg-white"
                      value={getDateOnly(session.end_datetime) || ""}
                      onChange={(e) => handleSessionChange(index, 'end', 'date', e.target.value)}
                      required
                    />
                    <Input
                      type="time"
                      className="w-32 bg-white"
                      value={getTimeOnly(session.end_datetime) || ""}
                      onChange={(e) => handleSessionChange(index, 'end', 'time', e.target.value)}
                      required
                    />
                  </div>
                </div>
                {errors[`session_${index}_end`] && (
                      <span className="text-xs font-medium text-red-600">{errors[`session_${index}_end`]}</span>
                    )}
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </Pane>

      {/* SECTION 2: Sub-CPLs & Indicators */}
      <Pane variant="shadow" className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Curriculum Mapping</h3>
        <p className="text-sm text-slate-500">Select a Sub-CPL to reveal and assign its indicators.</p>

        {errors.subcpls && (
          <span className="text-xs font-medium text-red-600 mt-2">{errors.subcpls}</span>
        )}
        
        <div className="space-y-3 mt-6">
          {subCpls?.map(subcpl => {
            const isSubCplSelected = resource?.subcpls?.some(s => s.sub_cpl_id === subcpl.sub_cpl_id);

            return (
              <div 
                key={subcpl.sub_cpl_id} 
                className={`border p-4 rounded-xl transition-all duration-200 ${
                  isSubCplSelected 
                    ? 'bg-primary-50/50 border-primary-200 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <label className="flex items-center gap-3 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSubCplSelected || false}
                    onChange={() => handleSubCplToggle(subcpl.sub_cpl_id)}
                    className="w-5 h-5 cursor-pointer text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <span className="text-primary-800 bg-white px-2 py-0.5 rounded border border-primary-100 text-sm">
                    {subcpl.code}
                  </span>
                  {subcpl.name}
                </label>

                {isSubCplSelected && (
                  <div className="mt-4 ml-8 p-4 bg-white border border-primary-100 rounded-lg shadow-inner">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-primary-700 mb-3">Target Indicators</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {subcpl.indicators?.map(i => {
                        const isIndicatorChecked = resource?.subcpls?.find(
                          s => s.sub_cpl_id === subcpl.sub_cpl_id
                        )?.indicators.some(resInd => resInd.indicator_id === i.indicator_id) || false;

                        return (
                          <label key={i.indicator_id} className="flex items-start gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors group">
                            <input
                               type="checkbox"
                               checked={isIndicatorChecked}
                               onChange={() => handleIndicatorToggle(subcpl.sub_cpl_id, i.indicator_id)}
                               className="mt-0.5 w-4 h-4 text-primary-600 border-slate-300 rounded cursor-pointer focus:ring-primary-500"
                            />
                            <span className={`text-sm leading-tight ${isIndicatorChecked ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                              {i.name}
                            </span>
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
      </Pane>

      {/* SECTION 3: Topics */}
      <Pane variant="shadow" className="p-6">
        <h3 className="text-lg font-bold text-slate-900">Topics & Weighting</h3>
        {errors.topics && (
          <span className="text-xs font-medium text-red-600 mt-4">{errors.topics}</span>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {topics?.map(topic => {
            const attachedTopic = resource?.topics?.find(t => t.topic_id === topic.topic_id);
            const isSelected = !!attachedTopic;

            return (
              <div 
                key={topic.topic_id} 
                className={`flex flex-col gap-3 p-4 border rounded-xl transition-all ${
                  isSelected ? 'bg-white border-primary-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-white'
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleTopicToggle(topic.topic_id)}
                    className="w-5 h-5 cursor-pointer text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <span className={`font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                    {topic.name}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </Pane>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-4">
        <Button
          type="submit"
          isLoading={submitting}
          size="lg"
          variant="solid" 
          className="w-full text-base"
        >
          {submitting ? "Saving Resource..." : "Save Resource"}
        </Button>

        {isEdit && (
          <div className="flex w-full gap-3 pt-4 border-t border-slate-200">
            <Button 
              type="button" // Prevents accidentally submitting the form
              onClick={onDelete} 
              isLoading={deleting}
              variant="danger" 
              className="flex-1"
            >
              Delete Resource
            </Button>
            
            {resource?.is_active ? (
              <Button 
                type="button"
                onClick={onArchive} 
                isLoading={archiving}
                variant="outline" 
                className="flex-1"
              >
                Deactivate
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={onActivate} 
                isLoading={activating}
                variant="secondary" 
                className="flex-1"
              >
                Activate
              </Button>
            )}
          </div>
        )}
      </div>

    </form>
  </div>
);
}

export default ResourceForm;