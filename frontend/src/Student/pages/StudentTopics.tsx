import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axios';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import type { Topic } from '../../types';

interface SelectedTopic {
  id: string;
  topic_id?: string;
  name: string;
  code?: string;
  eng_text?: string | null;
  isCustom: boolean;
}

const slugifyTopicCode = (value: string) => {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

  return cleaned || 'CUSTOM_TOPIC';
};

const mapTopicToSelected = (topic: Topic): SelectedTopic => ({
  id: topic.topic_id,
  topic_id: topic.topic_id,
  name: topic.name,
  code: topic.code,
  eng_text: topic.eng_text ?? null,
  isCustom: false,
});

const mapSavedTopicToPayload = (topic: SelectedTopic) => {
  if (topic.topic_id) {
    return { topic_id: topic.topic_id };
  }

  return {
    name: topic.name,
    code: topic.code || slugifyTopicCode(topic.name),
  };
};

function StudentTopics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nrp, setNrp] = useState<string | null>(null);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<SelectedTopic[]>([]);
  const [search, setSearch] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userRes, availableRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/topic'),
        ]);

        if (!userRes.data?.authenticated) {
          navigate('/student/login');
          return;
        }

        const studentId = userRes.data.user_id;
        setNrp(studentId);
        setAvailableTopics(availableRes.data.topics || []);

        const studentTopicsRes = await api.get(`/student/topics/${studentId}`);
        const studentTopics: Topic[] = studentTopicsRes.data.topics || [];
        setSelectedTopics(studentTopics.map(mapTopicToSelected));
      } catch (error) {
        console.error('Failed to load student topics', error);
        toast.error('Failed to load your topics.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const selectedExistingTopicIds = useMemo(() => {
    return new Set(selectedTopics.filter(topic => topic.topic_id).map(topic => topic.topic_id as string));
  }, [selectedTopics]);

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableTopics.filter(topic => {
      if (selectedExistingTopicIds.has(topic.topic_id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [topic.name, topic.code, topic.eng_text || '']
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query));
    });
  }, [availableTopics, search, selectedExistingTopicIds]);

  const addExistingTopic = (topic: Topic) => {
    if (selectedExistingTopicIds.has(topic.topic_id)) {
      setSelectedTopics(prev => prev.filter(item => item.topic_id !== topic.topic_id));
      return;
    }

    setSelectedTopics(prev => [...prev, mapTopicToSelected(topic)]);
  };

  const addCustomTopic = () => {
    const cleaned = customTopic.trim();
    if (!cleaned) {
      toast.error('Enter a topic name first.');
      return;
    }

    const duplicateExisting = availableTopics.find(topic => topic.name.toLowerCase() === cleaned.toLowerCase());
    if (duplicateExisting) {
      addExistingTopic(duplicateExisting);
      setCustomTopic('');
      toast.success('Added an existing topic instead.');
      return;
    }

    const duplicateCustom = selectedTopics.some(topic => !topic.topic_id && topic.name.toLowerCase() === cleaned.toLowerCase());
    if (duplicateCustom) {
      toast.error('That custom topic is already added.');
      return;
    }

    const newCustomTopic: SelectedTopic = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: cleaned,
      code: slugifyTopicCode(cleaned),
      isCustom: true,
    };

    setSelectedTopics(prev => [...prev, newCustomTopic]);
    setCustomTopic('');
  };

  const removeTopic = (topicId: string) => {
    setSelectedTopics(prev => prev.filter(topic => topic.id !== topicId));
  };

  const handleSave = async () => {
    if (!nrp) {
      toast.error('User identification missing. Please log in again.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        topics: selectedTopics.map(mapSavedTopicToPayload),
      };

      const response = await api.put(`/student/topics/${nrp}`, payload);
      const savedTopics: Topic[] = response.data.topics || [];
      setSelectedTopics(savedTopics.map(mapTopicToSelected));
      toast.success('Topics updated successfully.');
    } catch (error) {
      console.error('Failed to save student topics', error);
      toast.error('Failed to save topics.');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addCustomTopic();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium animate-pulse">Loading topics...</div>
      </div>
    );
  }

  if (!nrp) {
    return <Navigate to="/student/login" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <div className="absolute inset-0 pointer-events-none opacity-50" />
      <div className="relative max-w-7xl mx-auto px-6 py-10 md:px-8 lg:px-10">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm backdrop-blur-sm">
            Topic Library
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Manage your learning topics.
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Review your current interests, add existing topics from the database, or create new free-text topics when your interest is not listed yet.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <section className="bg-white/90 backdrop-blur rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Your selected topics</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Remove topics with the delete button, then save to update your profile.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <span className="font-bold text-slate-900">{selectedTopics.length}</span> topics selected
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 mb-6">
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  type="text"
                  value={customTopic}
                  onChange={(event) => setCustomTopic(event.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="Add a custom topic, e.g. human centered AI"
                  className="flex-1 bg-white"
                />
                <Button type="button" onClick={addCustomTopic} variant="outline" className="md:w-auto">
                  <FontAwesomeIcon icon={faPlus} /> Add custom topic
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Free-text topics will be stored as new topic nodes when you save.
              </p>
            </div>

            {selectedTopics.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {selectedTopics.map(topic => (
                  <div
                    key={topic.id}
                    className={`group relative min-w-[220px] max-w-full rounded-2xl border px-4 py-3 pr-12 shadow-sm transition-all ${topic.isCustom ? 'border-amber-200 bg-amber-50/80' : 'border-blue-200 bg-blue-50/80'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          <span>{topic.isCustom ? 'Custom' : 'Database'}</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-900 leading-snug break-words">
                          {topic.name}
                        </p>
                        {topic.eng_text && (
                          <p className="mt-1 text-xs text-slate-600 break-words">
                            {topic.eng_text}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTopic(topic.id)}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${topic.name}`}
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                You have not selected any topics yet. Add a few from the topic library or create your own.
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-500">
                Saving will update your topic interests and remove any topics you deleted from this list.
              </p>
              <Button type="button" onClick={handleSave} isLoading={saving} size="lg" className="w-full md:w-auto min-w-[220px]">
                {saving ? 'Saving changes...' : 'Save changes'}
              </Button>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="bg-white/90 backdrop-blur rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 md:p-7">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Existing topics</h2>
                  <p className="text-sm text-slate-500 mt-1">Pick one from the database or search by keyword.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <FontAwesomeIcon icon={faSearch} />
                </div>
              </div>

              <Input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search topics"
                className="bg-white"
              />

              <div className="mt-5 max-h-[620px] overflow-y-auto pr-1 space-y-3">
                {filteredTopics.length > 0 ? filteredTopics.map(topic => {
                  const isSelected = selectedExistingTopicIds.has(topic.topic_id);

                  return (
                    <button
                      key={topic.topic_id}
                      type="button"
                      onClick={() => addExistingTopic(topic)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${isSelected ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 break-words">{topic.name}</p>
                          <p className="mt-1 text-xs text-slate-500 break-words">{topic.code}</p>
                          {topic.eng_text && (
                            <p className="mt-1 text-xs text-slate-500 break-words">{topic.eng_text}</p>
                          )}
                        </div>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                          {isSelected ? <FontAwesomeIcon icon={faCheck} className="text-xs" /> : <span className="text-xs font-black">+</span>}
                        </div>
                      </div>
                    </button>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                    No matching topics found.
                  </div>
                )}
              </div>
            </section>

            <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700 shadow-xl p-6 md:p-7 text-white">
              <h3 className="text-lg font-extrabold">How it works</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-200 leading-relaxed">
                <li>• Click an existing topic to add or remove it from your profile.</li>
                <li>• Use the custom input to save a new topic that is not in the database yet.</li>
                <li>• Press Save changes to apply both additions and deletions.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default StudentTopics;
