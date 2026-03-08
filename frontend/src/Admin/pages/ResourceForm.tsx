import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import type { Resource } from "../../types";
import api from "../../api/axios";

function ResourceForm() {
  const { resource_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isEdit = location.pathname.includes("/edit");

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get("/users/me");

        if (!userRes.data.authenticated) {
          window.location.href = "/admin/login";
          return;
        }

        if (isEdit && resource_id) {
          const res = await api.get(`/resource/${resource_id}`);
          setResource(res.data.resource_details || null);
        } else {
          setResource({
            resource_id: "",
            type: "",
            name: "",
            description: "",
            start_datetime: "",
            end_datetime: "",
            status: "",
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

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!resource) return;

    const { name, value } = event.target;

    setResource({
      ...resource,
      [name]: value
    });
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

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save resource");
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="text-2xl mb-4">
        {isEdit ? "Edit Resource" : "Create Resource"}
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">

          <label>Name</label>
          <input
            type="text"
            name="name"
            value={resource?.name || ""}
            onChange={onChange}
            className="border p-2"
          />

          <label>Description</label>
          <input
            type="text"
            name="description"
            value={resource?.description || ""}
            onChange={onChange}
            className="border p-2"
          />

        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </form>
    </>
  );
}

export default ResourceForm;