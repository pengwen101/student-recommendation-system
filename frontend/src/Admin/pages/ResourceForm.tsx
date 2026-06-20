import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import type { ResourceInput, SubCpl, Topic, Organizer, ResourceSubCpl, CurriculumVersion, ResourceAssessment } from "../../types";
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { Pane } from '../../components/Pane';
import { Textarea } from '../../components/Textarea';
import api from "../../api/axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Editor from '../../components/Editor';
import axios from 'axios';

function ResourceForm() {
  // Hooks
  const { resource_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceInput | null>(null);
  const [resourceType, setResourceType] = useState<string>("event");
  const [resourceAssessments, setResourceAssessments] = useState<ResourceAssessment[] | null>(null);
  const [subCpls, setSubCpls] = useState<SubCpl[] | null>(null);
  const [clickedSubCpls, setClickedSubCpls] = useState<ResourceSubCpl[] | null> (null);
  const [organizers, setOrganizers] = useState<Organizer[] | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [versions, setVersions] = useState<CurriculumVersion[] | null>(null);
  const [versionId, setVersionId] = useState<string>("1");
  const [suggestedIndicatorIds, setSuggestedIndicatorIds] = useState<string[]>([]);
  const [similarResourceTitle, setSimilarResourceTitle] = useState<string | null>(null);
  const [similarResourceType, setSimilarResourceType] = useState<string | null>(null);
  const [recommending, setRecommending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = location.pathname.includes("/edit");

   useEffect(() => {
    const fetchData = async () => {
      try {
        const [subcplsRes, topicsRes, organizersRes, versionsRes, resourceAssessmentsRes] = await Promise.all([
            api.get(`/subcpl/indicators/${versionId}`),
            api.get("/topic"),
            api.get("/organizer"),
            api.get("/curriculum_version"),
            api.get(`/config/resource_assessments/${resourceType}`)
        ]);

        const fetchedSubCpls = subcplsRes.data.subcpls;
        setSubCpls(subcplsRes.data.subcpls);
        setTopics(topicsRes.data.topics);
        setOrganizers(organizersRes.data.organizers);
        setVersions(versionsRes.data.curriculum_versions);
        setResourceAssessments(resourceAssessmentsRes.data);

        if (isEdit && resource_id) {
          const res = await api.get(`/resource/${resource_id}`);
          const fetchedResource = res.data.resource_details;
          
          setResource(fetchedResource || null);
          setResourceType(fetchedResource.type);
          if (fetchedResource && fetchedSubCpls) {
            const resourceIndicatorIds = fetchedResource.indicators.map(
              (indicator: { indicator_id: string }) => indicator.indicator_id
            );
            
            const initialClickedSubCpls = fetchedSubCpls
              .filter((subcpl: SubCpl) =>
                subcpl.indicators.some((indicator: { indicator_id: string }) =>
                  resourceIndicatorIds.includes(indicator.indicator_id)
                )
              )
              .map((subcpl: SubCpl) => ({ sub_cpl_id: subcpl.sub_cpl_id }));
              
            setClickedSubCpls(initialClickedSubCpls);
          }
        } else {
          setResource({
            resource_id: "",
            //type: "event",
            title: "",
            // sessions: [],
            // scale: "university",
            // speaker_degree: "bachelor",
            // author_type: "personal_blog",
            // thematic_weight: "personal_opinion",
            // impact_scale: "local",
            // status: "",
            is_active: true,
            indicators: [],
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
  }, [resource_id, isEdit, versionId, resourceType]);


const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
console.log(GOOGLE_BOOKS_API_KEY);

const fetchBookInfo = async (title: string | null | undefined) => {
    if (!title) return; 
    setSearching(true);
    try {
      const query = encodeURIComponent(title);
      const res = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}&key=${GOOGLE_BOOKS_API_KEY}`
      );
      if (res.data.items && res.data.items.length > 0) {
        const book = res.data.items[0].volumeInfo;
        const isbnObj = book.industryIdentifiers?.find((id: any) => id.type === "ISBN_13") 
                     || book.industryIdentifiers?.find((id: any) => id.type === "ISBN_10");
        const extractedIsbn = isbnObj ? isbnObj.identifier : "";
        setResource(prev => {
          if (!prev) return null;
          return {
            ...prev,
            name: book.title,
            publisher: book.publisher || "",
            authors: book.authors || [],
            published_date: book.publishedDate || "",
            description: book.description || "",
            isbn: extractedIsbn
          };
        });
      } else {
        console.log("No books found matching that title.");
      }
    } catch (err) {
      console.error("Error fetching book details:", err);
    } finally {
      setSearching(false); 
    }
  };

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

  const handleAddAuthor = () => {
      setResource(prev => {
        if (!prev) return prev;
        
        return {
            ...prev,
            authors: [
                ...(prev.authors || []), 
                ""
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

  const handleRemoveAuthor = (indexToRemove: number) => {
      setResource(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          authors: prev.authors?.filter((_, index) => index !== indexToRemove)
        };
      });
  };

const handleAssessmentChange = (resource_assessment_id: string, resource_weight: number) => {
  if (!resource) return;
  const updatedAssessments = [...(resource.resource_assessments || [])];
  const existingIndex = updatedAssessments.findIndex(
    (a) => a.resource_assessment_id === resource_assessment_id
  );
  
  if (existingIndex >= 0) {
    updatedAssessments[existingIndex] = { 
      ...updatedAssessments[existingIndex], 
      resource_weight: resource_weight 
    };
  } else {
    updatedAssessments.push({ 
      resource_assessment_id: resource_assessment_id, 
      resource_weight: resource_weight 
    });
  }
  setResource({
    ...resource,
    resource_assessments: updatedAssessments
  });
  const newErrors = { ...errors };
  if (newErrors.resource_assessments) {
    delete newErrors.resource_assessments;
    setErrors(newErrors);
  }
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

      if (resourceType === 'event') {
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

      if (resourceType === 'event') {
        if (!updatedOrganizers || updatedOrganizers.length === 0) {
          newErrors.organizers = "Events must have an organizer.";
        } else {
          delete newErrors.organizers;
        }
      }

      setErrors(newErrors);
  };

  const handleAuthorChange = (index: number, value: string) => {
      const updatedAuthors = [...(resource?.authors || [])];
      let author = updatedAuthors[index];

      author = value;
      updatedAuthors[index] = author;

      const updatedResource = { ...resource, authors: updatedAuthors } as ResourceInput;
      setResource(updatedResource);
      const newErrors = { ...errors };

      if (resourceType === 'book') {
        if (!updatedAuthors || updatedAuthors.length === 0) {
          newErrors.authors = "Books must have an author.";
        } else {
          delete newErrors.authors;
        }
      }

      setErrors(newErrors);
  };

  const availableStudyLevels = ["1", "2", "3", "4"];
  
  const currentStudyLevels = resource?.study_levels || [];
  const currentStudyLevelIds = currentStudyLevels.map(sl => sl.study_level_id);
  const isAllLevelsChecked = availableStudyLevels.every(level => currentStudyLevelIds.includes(level));

  const handleStudyLevelToggle = (level: string | 'all') => {
    if (!resource) return;

    let newLevels = [...currentStudyLevels];

    if (level === 'all') {
      if (isAllLevelsChecked) {
        newLevels = [];
      } else {
        newLevels = availableStudyLevels.map(l => ({ study_level_id: l }));
      }
    } else {
      const isCurrentlyChecked = newLevels.some(l => l.study_level_id === level);
      
      if (isCurrentlyChecked) {
        newLevels = newLevels.filter(l => l.study_level_id !== level);
      } else {
        newLevels.push({ study_level_id: level });
      }
    }

    setResource({ ...resource, study_levels: newLevels });

    const newErrors = {...errors};
    if (newLevels.length == 0) {
      newErrors.studyLevels = "Must select study level.";
    } else {
      delete newErrors.studyLevels;
    }
    setErrors(newErrors);
  };

  const handleSubCplToggle = (subCplId: string) => {
    if (!resource || !subCpls) return;

    const currentClicked = clickedSubCpls || [];
    const currentIndicators = resource.indicators || [];

    const isTicked = currentClicked.some((c) => c.sub_cpl_id === subCplId);
    const targetSubCpl = subCpls.find((s) => s.sub_cpl_id === subCplId);

    let newClickedSubCpls = [...currentClicked];
    let newIndicators = [...currentIndicators];

    if (isTicked) {
      newClickedSubCpls = newClickedSubCpls.filter((c) => c.sub_cpl_id !== subCplId);

      if (targetSubCpl) {
        const indicatorsToRemove = targetSubCpl.indicators.map((i) => i.indicator_id);
        newIndicators = newIndicators.filter(
          (indicator) => !indicatorsToRemove.includes(indicator.indicator_id)
        );
      }
    } else {
      newClickedSubCpls.push({ sub_cpl_id: subCplId });
    }

    setClickedSubCpls(newClickedSubCpls);
    setResource({ ...resource, indicators: newIndicators });
    const newErrors = {...errors};
    if (newIndicators.length === 0) {
      newErrors.subcpls = "At least one Sub-CPL and one Indicator must be selected.";
    } else {
      delete newErrors.subcpls;
    }
    setErrors(newErrors);
  };

  const handleIndicatorToggle = (indicatorId: string) => {
    if (!resource || !subCpls) return;

    const currentClicked = clickedSubCpls || [];
    const currentIndicators = resource.indicators || [];

    const isTicked = currentIndicators.some((i) => i.indicator_id === indicatorId);

    let newIndicators = [...currentIndicators];
    let newClickedSubCpls = [...currentClicked];

    if (isTicked) {
      newIndicators = newIndicators.filter((i) => i.indicator_id !== indicatorId);
      newClickedSubCpls = newClickedSubCpls.filter((clickedCpl) => {
        const subCplData = subCpls.find((s) => s.sub_cpl_id === clickedCpl.sub_cpl_id);
        if (!subCplData) return false;
      
        const hasRemainingTicked = subCplData.indicators.some((ind) =>
          newIndicators.some((ni) => ni.indicator_id === ind.indicator_id)
        );
        
        return hasRemainingTicked;
      });

    } else {
      newIndicators.push({ indicator_id: indicatorId });
      subCpls.forEach((subCpl) => {
        const containsIndicator = subCpl.indicators.some(i => i.indicator_id === indicatorId);
        const isAlreadyClicked = newClickedSubCpls.some(c => c.sub_cpl_id === subCpl.sub_cpl_id);
        
        if (containsIndicator && !isAlreadyClicked) {
          newClickedSubCpls.push({ sub_cpl_id: subCpl.sub_cpl_id });
        }
      });
    }

    setResource({ ...resource, indicators: newIndicators });
    setClickedSubCpls(newClickedSubCpls);
    const newErrors = { ...errors };
    if (newIndicators.length === 0) {
      newErrors.subcpls = "At least one Sub-CPL and one Indicator must be selected.";
    } else {
      delete newErrors.subcpls;
    }
    setErrors(newErrors);
  };

  const handleVersionChange = (version_id: string) => {
    setVersionId(version_id);
  }

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

  const handleGetIndicatorRecommendation = () => {
    const title = resource?.title || "";
    const description = resource?.description || "";
    
    if (!title.trim() && !description.trim()) {
      toast.error("Please enter a title or description first to get recommendations.");
      return;
    }

    setRecommending(true);
    
    api.get(`/resource/indicator_recommendation`, { params: { title, description } })
      .then(res => {
        const result = res.data;
        setSuggestedIndicatorIds(result.suggested_indicator_ids || []);
        setSimilarResourceTitle(result.similar_resource_title || null);
        setSimilarResourceType(result.similar_resource_type || null);
        
        toast.success("Recommendations generated!");
      })
      .catch(err => {
        console.log(err);
        toast.error("Failed to fetch recommendations.");
      })
      .finally(() => {
        setRecommending(false);
      });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resource) return;
    const newErrors: Record<string, string> = {};

    if (!resource.title?.trim()) {
      newErrors.title = "Title is required.";
    }

    if (resourceType != 'article' && !resource.description?.trim()) {
      newErrors.description = "Description is required.";
    }

    if (resource.indicators.length == 0) {
      newErrors.subcpls = "At least one Sub-CPL and one Indicator must be selected.";
    }

    if (resource.topics.length == 0) {
      newErrors.topics = "At least one topic must be selected.";
    }

    if (resourceType === 'event') {
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

      if (!resource?.study_levels || resource?.study_levels?.length === 0){
        newErrors.studyLevels = "Must select study level."
      }
    }


    if (resourceType === 'article') {
      if (!resource.article_text || !resource.article_text.blocks || resource.article_text.blocks.length === 0) {
        newErrors.article_text = "Article content cannot be empty.";
      }
    }

    // if (resource.type === 'book' || resource.type == "video") {
    //   if (!resource.author_type) {
    //     console.log(resource.author_type);
    //     newErrors.author_type = "Author type cannot be empty.";
    //   }
    //   if (!resource.impact_scale) {
    //     newErrors.impact_scale = "Impact scale cannot be empty.";
    //   }
    //   if (!resource.thematic_weight) {
    //     newErrors.thematic_weight = "Thematic weight cannot be empty.";
    //   }
    // }

    if (resourceType === "book") {
      if (!resource.authors || resource.authors.length === 0) {
          newErrors.authors = "Book must have an author.";
      }

      if (!resource.isbn) {
          newErrors.isbn = "Book must have an ISBN.";
      }

      if (!resource.publisher) {
          newErrors.publisher = "Book must have a publisher.";
      }

      if (!resource.published_date) {
          newErrors.published_date = "Book must have a published date.";
      }
    }

    if (resource.resource_assessments) {
      resource.resource_assessments.forEach((assessment, index) => {
        if (assessment.resource_weight <= 0 || assessment.resource_weight > 1) {
          newErrors[`resource_assessments_${index}`] = "Weight must be between 0 and 1.0.";
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        console.log(newErrors);
        toast.error("Please fix the highlighted errors in the form."); 
        return; 
    }

    setErrors({});
    setSubmitting(true);

    let computedStatus;

    if (resourceType === 'event' && resource.sessions && resource.sessions.length > 0) {
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
      //type: resource.type,
      title: resource.title,
      ...(resourceType !== "article" ? {description: resource.description} : {}),
      is_active: resource.is_active,
      ...(resourceType === 'event' && computedStatus ? { status: computedStatus } : {}),
      //...(resourceType === 'event' && resource.scale ? { scale: resource.scale } : {}),
      ...(resourceType === 'event' && resource.organizers ? { organizers: resource.organizers } : {}),
      //...(resourceType === 'event' && resource.speaker_degree && resource.speaker_degree !== "no_speaker" ? { speaker_degree: resource.speaker_degree } : {}),
      ...(resourceType === 'event' && resource.study_levels ? { study_levels: resource.study_levels } : {}),
      ...(resourceType === 'article' && resource.article_text ? { article_text: resource.article_text } : {}),

      ...(resourceType === 'book' && resource.isbn ? { isbn: resource.isbn } : {}),
      ...(resourceType === 'book' && resource.publisher ? { publisher: resource.publisher } : {}),
      ...(resourceType === 'book' && resource.authors ? { authors: resource.authors } : {}),
      ...(resourceType === 'book' && resource.published_date ? { published_date: resource.published_date } : {}),
      ...(resourceType === 'video' && resource.content_link ? { content_link: resource.content_link } : {}),
      ...(resource.resource_assessments ? {resource_assessments: resource.resource_assessments}: {}),
      ...(resource.text_hash ? {text_hash: resource.text_hash}: {}),

      // ...((resourceType === 'book' || resourceType === "video") && resource.author_type ? { author_type: resource.author_type } : {}),
      // ...((resourceType === 'book' || resourceType === "video") && resource.impact_scale ? { impact_scale: resource.impact_scale } : {}),
      // ...((resourceType === 'book' || resourceType === "video") && resource.thematic_weight ? { thematic_weight: resource.thematic_weight } : {}),

      ...(resourceType === 'event' ? {
        sessions: (resource.sessions || []).map((session) => ({
          ...(session.session_id ? { session_id: session.session_id } : {}),
          start_datetime: session.start_datetime,
          end_datetime: session.end_datetime
        }))
      } : {}),

      indicators: resource.indicators,
      topics: resource.topics
    };

    console.log(resource_input);

    try {
      if (isEdit) {
        await api.put(`/resource/${resource.resource_id}`, resource_input);
      } else {
        await api.post(`/resource/${resourceType}`, resource_input);
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

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-slate-500 animate-pulse font-medium">Loading resource form...</div>
    </div>
  );

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
  {/* Header Section */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
    <h3 className="text-lg font-bold text-slate-900 m-0">Basic Details</h3>
    <div className="flex items-center gap-3">
      <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Type</label>
      <div className="flex flex-col min-w-[150px]">
        <Select 
          name="type" 
          onChange={(e) => setResourceType(e.target.value)} 
          value={resourceType || ""}
        >
          <option value="event">Event</option>
          <option value="book">Book</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
        </Select>
        {errors.type && (
          <span className="text-xs font-medium text-red-600 mt-1">
            {errors.type}
          </span>
        )}
      </div>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Title Input */}
    <div className={`flex flex-col gap-2 ${resourceType === 'book' ? 'md:col-span-2' : 'md:col-span-3'}`}>
      <label className="text-sm font-semibold text-slate-700">Name</label>
      <Input
        type="text"
        name="title"
        placeholder="e.g. Intro to Advanced Robotics"
        value={resource?.title || ""}
        onChange={onChange}
      />
      {errors.title && (
        <span className="text-xs font-medium text-red-600 mt-1">
          {errors.title}
        </span>
      )}
    </div>

    {/* Search Book Button aligned to bottom of input */}
    {resourceType === 'book' && (
      <div className="flex items-end col-span-1">
        <Button
          type="button"
          isLoading={searching}
          onClick={() => fetchBookInfo(resource?.title)}
          size="default"
          variant="solid"
          className="text-base w-full h-[42px]"
        >
          {searching ? "Searching..." : "Search Book"}
        </Button>
      </div>
    )}

    {/* Video Link */}
    {resourceType === "video" && (
      <div className="flex flex-col gap-2 md:col-span-3">
        <label className="text-sm font-semibold text-slate-700">Content Link</label>
        <Input
          type="text"
          name="content_link"
          placeholder="https://youtube.com/..."
          value={resource?.content_link || ""}
          onChange={onChange}
        />
        {errors.content_link && (
          <span className="text-xs font-medium text-red-600 mt-1">
            {errors.content_link}
          </span>
        )}
      </div>
    )}

    {/* Book Specifics (Neatly aligned in one row) */}
    {resourceType === "book" && (
      <>
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-sm font-semibold text-slate-700">ISBN</label>
          <Input
            type="text"
            name="isbn"
            placeholder="e.g. 978-3-16-148410-0"
            value={resource?.isbn || ""}
            onChange={onChange}
          />
          {errors.isbn && (
            <span className="text-xs font-medium text-red-600 mt-1">
              {errors.isbn}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-sm font-semibold text-slate-700">Publisher</label>
          <Input
            type="text"
            name="publisher"
            placeholder="e.g. O'Reilly Media"
            value={resource?.publisher || ""}
            onChange={onChange}
          />
          {errors.publisher && (
            <span className="text-xs font-medium text-red-600 mt-1">
              {errors.publisher}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-sm font-semibold text-slate-700">Published Date</label>
          <Input
            type="date"
            name="published_date"
            className="bg-white"
            value={getDateOnly(resource?.published_date) || ""}
            onChange={(e) => onChange(e)}
            required
          />
          {errors.published_date && (
            <span className="text-xs font-medium text-red-600 mt-1">
              {errors.published_date}
            </span>
          )}
        </div>

        {/* Authors Section */}
        <div className="flex flex-col md:col-span-3 gap-4 mt-2 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="text-base font-bold text-slate-900">Authors</h4>
              <p className="text-sm text-slate-500">Input author(s) of this book.</p>
            </div>
            <Button
              type="button"
              onClick={handleAddAuthor}
              variant="outline"
              size="sm"
              className="text-primary-700 border-primary-200 hover:bg-primary-50"
            >
              + Add Author
            </Button>
          </div>
          {errors.authors && (
            <span className="text-xs font-medium text-red-600 mt-1">{errors.authors}</span>
          )}
          
          {resource?.authors?.map((author, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-slate-300"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Author {index + 1}
                </span>

                {resource.authors && resource.authors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAuthor(index)}
                    className="text-slate-400 hover:text-danger-600 transition-colors p-1"
                    title="Remove author"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Author Name</label>
                <Input
                  type="text"
                  name="author"
                  className="bg-white"
                  value={author || ""}
                  onChange={(e) => handleAuthorChange(index, e.target.value)}
                  required
                />
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {/* Commented out dropdowns */}
    {/* {(resource?.type === "book" || resource?.type === "video") && (
      <>
        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-sm font-semibold text-slate-700">Author Type</label>
          <Select name="author_type" value={resource?.author_type || "personal_blog"} onChange={onChange}>
            <option value="personal_blog">Personal Blog</option>
            <option value="practitioner">Practitioner</option>
            <option value="academic">Academic</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-sm font-semibold text-slate-700">Impact Scale</label>
          <Select name="impact_scale" value={resource?.impact_scale || "local"} onChange={onChange}>
            <option value="local">Local</option>
            <option value="international">International</option>
            <option value="worldwide">Worldwide</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-1">
          <label className="text-sm font-semibold text-slate-700">Thematic Weight</label>
          <Select name="thematic_weight" value={resource?.thematic_weight || "personal_opinion"} onChange={onChange}>
            <option value="personal_opinion">Personal Opinion</option>
            <option value="academic_journal">Academic Journal</option>
            <option value="critique">Critique</option>
            <option value="philosophy">Philosophy</option>
          </Select>
        </div>
      </>
    )} */}

    {/* Description (For non-articles) */}
    {resourceType !== 'article' && (
      <div className="flex flex-col gap-2 md:col-span-3 mt-2">
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
    )}

    {/* Article Specific Details */}
    {resourceType === 'article' && (
      <div className="md:col-span-3 mt-4 border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Article Content</h3>
        </div>
        <div className="p-6 bg-white flex flex-col gap-2">
          <div className="min-h-[300px]">
            <Editor
              editorBlock="editorjs-container"
              data={resource?.article_text}
              onChange={(data) => {
                setResource((prev) => (prev ? { ...prev, article_text: data } : prev));
                if (data?.blocks?.length > 0) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.article_text;
                    return newErrors;
                  });
                }
              }}
            />
          </div>
          {errors.article_text && (
            <span className="text-xs font-medium text-red-600 mt-1">
              {errors.article_text}
            </span>
          )}
        </div>
      </div>
    )}
  </div>

  {/* Event Specifics */}
  {resourceType === 'event' && (
    <>
      <div className="grid grid-cols-1 gap-6 mt-6 pt-6 border-t border-slate-100">
        
        {/* Study Level Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Available for Study Level</label>
          <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllLevelsChecked}
                onChange={() => handleStudyLevelToggle('all')}
                className="w-4 h-4 text-primary-600 border-slate-300 rounded cursor-pointer focus:ring-primary-500"
              />
              <span className={`text-sm font-medium ${isAllLevelsChecked ? 'text-primary-800' : 'text-slate-700'}`}>
                All Levels
              </span>
            </label>

            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

            {availableStudyLevels.map((level) => {
              const isChecked = currentStudyLevelIds.includes(level);
              return (
                <label key={level} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleStudyLevelToggle(level)}
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded cursor-pointer focus:ring-primary-500"
                  />
                  <span className={`text-sm ${isChecked ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                    Level {level}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.studyLevels && (
            <span className="text-xs font-medium text-red-600 mt-1">
              {errors.studyLevels}
            </span>
          )}
        </div>
      </div>

      {/* Event Organizers */}
      <div className="flex flex-col gap-4 mt-8">
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
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Organizer Name</label>
              <Select 
                name="organizer" 
                value={organizer.organizer_id || ""} 
                onChange={(e) => handleOrganizerChange(index, e.target.value)}
                className="bg-white"
              >
                <option value="" disabled>Select an organizer...</option>
                {organizers?.map((org) => (
                  <option key={org.organizer_id} value={org.organizer_id}>
                    {org.name.charAt(0).toUpperCase() + org.name.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
      </div>

      {/* Event Sessions */}
      <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-slate-100">
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="date"
                    className="flex-1 bg-white"
                    value={getDateOnly(session.start_datetime) || ""}
                    onChange={(e) => handleSessionChange(index, 'start', 'date', e.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    className="w-full sm:w-32 bg-white"
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="date"
                    className="flex-1 bg-white"
                    value={getDateOnly(session.end_datetime) || ""}
                    onChange={(e) => handleSessionChange(index, 'end', 'date', e.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    className="w-full sm:w-32 bg-white"
                    value={getTimeOnly(session.end_datetime) || ""}
                    onChange={(e) => handleSessionChange(index, 'end', 'time', e.target.value)}
                    required
                  />
                </div>
                {errors[`session_${index}_end`] && (
                  <span className="text-xs font-medium text-red-600">{errors[`session_${index}_end`]}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</Pane>

{/* Resource Assessments Section */}
<Pane variant="shadow" className="p-6 mt-6">
  <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Assessments</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
    {resourceAssessments?.map((resourceAssessment, index) => {
      const currentVal = resource?.resource_assessments?.find(
        (a) => a.resource_assessment_id === resourceAssessment.resource_assessment_id
      )?.resource_weight || 0;

      return (
        <div key={resourceAssessment.resource_assessment_id || index} className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-700">
              {resourceAssessment.display_name}
            </label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {currentVal.toFixed(2)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentVal}
            onChange={(e) => handleAssessmentChange(resourceAssessment.resource_assessment_id, parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          {errors[`resource_assessments_${index}`] && (
            <span className="text-xs font-medium text-red-600 mt-1">
              {errors[`resource_assessments_${index}`]}
            </span>
          )}
        </div>
      );
    })}
  </div>
</Pane>


      {/* SECTION 2: Sub-CPLs & Indicators */}
      {/* SECTION 2: Sub-CPLs & Indicators */}
      <Pane variant="shadow" className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Curriculum Mapping</h3>
            <p className="text-sm text-slate-500">Select a Sub-CPL to reveal and assign its indicators.</p>
            
            {/* NEW: Similar Resource Display */}
            {similarResourceTitle && similarResourceType && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                  {similarResourceType}
                </span>
                Based on similarities with: <span className="font-bold italic">{similarResourceTitle}</span>
              </div>
            )}
          </div>
          
          <Button 
            type="button" 
            onClick={handleGetIndicatorRecommendation}
            isLoading={recommending}
            variant="outline"
            size="sm"
            className="text-amber-700 border-amber-200 hover:bg-amber-50 bg-amber-50/30"
          >
            ✨ Get Recommendations
          </Button>
        </div>

        <Select name="version_id" value={versionId || ""} onChange={ (e) => handleVersionChange(e.target.value)}>
          {
            versions?.map(version => (
              <option key={version.curriculum_version_id} value={version.curriculum_version_id}>{version.curriculum_version_id}</option>
            ))
          }
        </Select>

        {errors.subcpls && (
          <span className="text-xs font-medium text-red-600 mt-2">{errors.subcpls}</span>
        )}
        
        <div className="space-y-3 mt-6">
          {subCpls?.map(subcpl => {
            const isSubCplSelected = clickedSubCpls?.some(clickedSubCpl => clickedSubCpl.sub_cpl_id == subcpl.sub_cpl_id);
            const hasRecommended = subcpl.indicators?.some(i => suggestedIndicatorIds.includes(i.indicator_id));
            const shouldRevealIndicators = isSubCplSelected || hasRecommended;

            return (
              <div 
                key={subcpl.sub_cpl_id} 
                className={`border p-4 rounded-xl transition-all duration-200 ${
                  isSubCplSelected 
                    ? 'bg-primary-50/50 border-primary-200 shadow-sm' 
                    : hasRecommended 
                      ? 'bg-amber-50/10 border-amber-300 shadow-sm'
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

                {/* Changed this condition to use the new shouldRevealIndicators variable */}
                {shouldRevealIndicators && (
                  <div className={`mt-4 ml-8 p-4 bg-white border rounded-lg shadow-inner ${hasRecommended ? 'border-amber-200' : 'border-primary-100'}`}>
                    <h4 className={`font-semibold text-xs uppercase tracking-wider mb-3 ${hasRecommended ? 'text-amber-700' : 'text-primary-700'}`}>
                      Target Indicators
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {subcpl.indicators?.map(i => {
                        const isIndicatorChecked = resource?.indicators.some(resInd => resInd.indicator_id === i.indicator_id) || false;
                        const isRecommended = suggestedIndicatorIds.includes(i.indicator_id);

                        return (
                          <label key={i.indicator_id} className={`flex items-start gap-3 cursor-pointer p-2 rounded-md transition-colors group ${isRecommended && !isIndicatorChecked ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-slate-50'}`}>
                            <input
                               type="checkbox"
                               checked={isIndicatorChecked}
                               onChange={() => handleIndicatorToggle(i.indicator_id)}
                               className="mt-0.5 w-4 h-4 text-primary-600 border-slate-300 rounded cursor-pointer focus:ring-primary-500"
                            />
                            <span className={`text-sm leading-tight flex items-center flex-wrap gap-1.5 ${isIndicatorChecked ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                              {i.name}
                              {isRecommended && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                  ✨ Recommended
                                </span>
                              )}
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