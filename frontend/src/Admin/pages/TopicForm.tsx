import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import type { Topic } from "../../types";
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Pane } from '../../components/Pane';
import api from "../../api/axios";

function TopicForm() {
  // Hooks
  const { topic_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = location.pathname.includes("/edit");

   useEffect(() => {
    const fetchData = async () => {
      try {
        if (isEdit && topic_id) {
          const res = await api.get(`/topic/${topic_id}`);
          setTopic(res.data.topic_details || null);
        } else {
          setTopic({
            topic_id: "",
            code: "",
            name: ""
          } as Topic);
        }
      } catch {
        toast.error("Failed to load topic");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topic_id, isEdit]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!topic) return;

    const { name, value } = event.target;

    setTopic( {
      ...topic,
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

    setErrors(newErrors);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!topic) return;
    const newErrors: Record<string, string> = {};

    if (!topic.name?.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!topic.code?.trim()) {
      newErrors.code = "Code is required.";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fix the highlighted errors in the form."); 
        return; 
    }

    setErrors({});
    setSubmitting(true);

    const topic_input = {
      name: topic.name,
      code: topic.code
    }

    try {
      if (isEdit) {
        console.log(topic_input)
        await api.put(`/topic/${topic.topic_id}`, topic_input);
      } else {
        await api.post("/topic", topic_input);
      }

      navigate("/topic", {
        state: { successMessage: "topic saved successfully" }
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
      const response = await api.delete(`/topic/${topic?.topic_id}`);
      navigate("/topic", {
        state: { successMessage: response.data.message }
      });
    } catch {
      toast.error("Failed to delete topic");
    } finally {
      setDeleting(false);
    }
  };


  if (loading) return <div>Loading...</div>;

  return (
  <div className="max-w-4xl mx-auto pb-12">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        {isEdit ? "Edit topic" : "Create topic"}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Configure the details of topic.
      </p>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      
      {/* SECTION 1: Basic Details */}
      <Pane variant="shadow" className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Basic Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Code</label>
            <Input
              type="text"
              name="code"
              placeholder="e.g. Intro to Advanced Robotics"
              value={topic?.code || ""}
              onChange={onChange}
            />
            {errors.code && (
              <span className="text-xs font-medium text-red-600 mt-1">
                {errors.code}
              </span>
            )}
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <Input
              type="text"
              name="name"
              placeholder="e.g. Intro to Advanced Robotics"
              value={topic?.name || ""}
              onChange={onChange}
            />
            {errors.name && (
              <span className="text-xs font-medium text-red-600 mt-1">
                {errors.name}
              </span>
            )}

          </div>
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
          {submitting ? "Saving topic..." : "Save topic"}
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
              Delete Topic
            </Button>
          </div>
        )}
      </div>

    </form>
  </div>
);
}

export default TopicForm;