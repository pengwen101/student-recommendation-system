import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios.tsx';
import type { Topic } from '../../types.ts';
import toast from 'react-hot-toast';
import { Pane } from '../../components/Pane';
import { Button } from '../../components/Button';

function SelectTopics(){
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const location = useLocation();
    const nrp = location.state?.nrp;

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await api.get("/topic");
                setTopics(response.data.topics);
            } catch (error) {
                let errorMessage = "An unknown error occurred";
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                else if (typeof error === 'string') {
                    errorMessage = error;
                }
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        }
        fetchTopics();
    }, [])

    const onSelect = (topic_id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic_id));
        } else {
            setSelectedTopics([...selectedTopics, topic_id]);
        }
    }

    const onSubmit = async () => {
        const student_topics_input = {
            "topics": selectedTopics.map((topic_id)=> ({
                "topic_id" : topic_id,
                "weight": 1.0}))
        }
        try {
            await api.post(`/student/topics/${nrp}`, student_topics_input);
            window.location.href = "/";
        } catch (error) {
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
        <div className="h-screen flex justify-center items-center px-4">
            <div className="w-full max-w-3xl">
                <Pane variant="shadow">
                    <form 
                        className="flex flex-col gap-y-6 items-center" 
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                    >
                        <h2 className="text-xl font-semibold text-slate-800">
                            Select topics that interest you
                        </h2>

                        {loading ? (
                            <div className="text-slate-500 animate-pulse py-10">
                                Loading topics...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                                {topics.map((topic) => {
                                    const isSelected = selectedTopics.some(t => t === topic.topic_id);
                                    return (
                                        <Button
                                            key={topic.topic_id}
                                            type="button"
                                            variant={isSelected ? "solid" : "outline"}
                                            onClick={() => onSelect(topic.topic_id, isSelected)}
                                            className="w-full"
                                        >
                                            {topic.name}
                                        </Button>
                                    );
                                })}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            size="lg" 
                            className="w-full md:w-1/2 mt-2"
                            disabled={loading}
                        >
                            Proceed
                        </Button>
                    </form>
                </Pane>
            </div>
        </div>
    );
}

export default SelectTopics;