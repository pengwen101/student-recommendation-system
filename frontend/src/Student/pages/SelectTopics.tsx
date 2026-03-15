import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios.tsx';
import type { Topic } from '../../types.ts';
import toast from 'react-hot-toast';

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
        <div className="h-screen flex justify-center items-center">
            <form className="flex flex-col gap-y-4 w-3/4 items-center">
                <div className="text-lg text-white">Select topics that interests you.</div>
                { loading ? (<div className="text-gray animate-pulse">Loading...</div>) : (
                <div className="grid grid-cols-3 gap-2 w-full">
                    {topics.map((topic) => {
                        const isSelected = selectedTopics.some(t => t === topic.topic_id);
                        return (
                        <div key={topic.topic_id}
                            onClick= {() => onSelect(topic.topic_id, isSelected)}
                            className={`border py-2 px-4 border-white rounded-lg flex justify-center items-center ${isSelected ? "bg-blue-200 border-blue-500 text-gray-900" : ""}`}>
                            {topic.name}
                        </div>
                        )
                    })}
                </div>)
                }
                <div onClick={onSubmit} className="font-bold  px-4 py-2 bg-white text-gray-900 rounded-lg">Proceed</div>
            </form>
        </div>
    )
}

export default SelectTopics;