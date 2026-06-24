import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // Adjust path to your axios instance
import type { QuestionResponse, StudentQuestionRelation } from '../../types';

const SurveyAssessment = () => {
    const navigate = useNavigate();
    
    // State
    const [nrp, setNrp] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuestionResponse[]>([]);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchSurveyData = async () => {
            try {
                const userRes = await api.get('/users/me');

                if (!userRes.data.authenticated) {
                    navigate('/student/login');
                    return;
                }

                const nrpValue = userRes.data.user_id;
                setNrp(nrpValue);

                const yearDigits = nrpValue.substring(3, 5);
                const year = parseInt(yearDigits, 10);
                const batchId = `20${year}/20${year + 1}`;

                const questionsRes = await api.get('/curriculum_q', {
                    params: { batch_id: batchId }
                });

                setQuestions(questionsRes.data);
            } catch (err) {
                console.error("Failed to load survey data", err);
                setError("Failed to load survey data. Please try refreshing the page.");
            } finally {
                setLoading(false);
            }
        };

        fetchSurveyData();
    }, [navigate]);

    // Check if all questions have been answered
    const isComplete = useMemo(() => {
        if (questions.length === 0) return false;
        return questions.every(q => answers[q.question_id] !== undefined);
    }, [questions, answers]);

    // Handle answer selection
    const handleAnswerChange = (questionId: string, value: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nrp || !isComplete) return;

        setSubmitting(true);
        setError(null);

        try {
            // Format data exactly as the FastAPI List[StudentQuestionRelation] schema requires
            const payload: StudentQuestionRelation[] = questions.map(q => ({
                question_id: q.question_id,
                answer: answers[q.question_id]
            }));

            await api.post(`/student/questions/${nrp}`, payload);
            
            // Redirect after successful submission (e.g., to the dashboard or profile)
            navigate('/home'); 
        } catch (err) {
            console.error("Failed to submit survey", err);
            setError("Failed to submit your answers. Please try again.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-slate-500 font-medium animate-pulse">Loading Assessment...</div>
            </div>
        );
    }

    if (error && questions.length === 0) {
        return (
            <div className="max-w-3xl mx-auto p-8 mt-10 bg-red-50 border border-red-200 text-red-600 rounded-xl">
                {error}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:px-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Competency Assessment</h1>
                <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
                    Please answer the following questions honestly to help us tailor your learning recommendations.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {questions.map((question, index) => {
                    // Generate the numerical range between lower_bound and upper_bound
                    const min = parseInt(question.lower_bound, 10);
                    const max = parseInt(question.upper_bound, 10);
                    
                    // Create an array [1, 2, 3, 4, 5] based on min/max bounds
                    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

                    return (
                        <div key={question.question_id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-6">
                                <span className="text-blue-600 mr-2">{index + 1}.</span> 
                                {question.name}
                            </h3>

                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                {/* Lower Bound Label */}
                                <div className="text-sm font-medium text-slate-500 md:w-32 md:text-right">
                                    {question.lower_text || min}
                                </div>

                                {/* Radio Scale */}
                                <div className="flex justify-center items-center gap-2 md:gap-4 flex-grow">
                                    {range.map((value) => (
                                        <label 
                                            key={value} 
                                            className="flex flex-col items-center cursor-pointer group"
                                        >
                                            <input
                                                type="radio"
                                                name={question.question_id}
                                                value={value}
                                                checked={answers[question.question_id] === value}
                                                onChange={() => handleAnswerChange(question.question_id, value)}
                                                className="hidden" // Hide native radio
                                            />
                                            <div className={`
                                                w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-sm font-bold border-2 transition-all duration-200
                                                ${answers[question.question_id] === value 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-110' 
                                                    : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:border-blue-300 group-hover:bg-blue-50'}
                                            `}>
                                                {value}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Upper Bound Label */}
                                <div className="text-sm font-medium text-slate-500 md:w-32 md:text-left">
                                    {question.upper_text || max}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Submit Container */}
                <div className="sticky bottom-6 mt-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-200 flex justify-between items-center z-10">
                    <div className="text-sm font-medium text-slate-600">
                        {Object.keys(answers).length} of {questions.length} answered
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!isComplete || submitting}
                        className={`px-8 py-3 rounded-xl font-bold transition-all ${
                            isComplete && !submitting
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {submitting ? 'Submitting...' : 'Complete Assessment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SurveyAssessment;