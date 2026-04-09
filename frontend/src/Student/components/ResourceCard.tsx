import type { ResourceRecommendation } from "../../types";
import { Link } from 'react-router-dom';

function ResourceCard(props: ResourceRecommendation) {
    const resource = props.resource;
    
    // Assuming your probability score is passed via props.probability or props.score.
    // Adjust this variable name to match your actual API response!
    const rawScore = props.probability_score; 

    // Helper to format the score gracefully
    const getFormattedScore = (score?: number) => {
        if (score === undefined || score === null) return null;
        const percentage = Math.round(score * 100);
        return percentage;
    };

    const matchPercentage = getFormattedScore(rawScore);

    // Smart Schedule Formatter
    const getScheduleText = () => {
        const sessions = resource.sessions || [];
        
        if (sessions.length === 0) {
            return "Available Anytime";
        }

        const sortedSessions = [...sessions].sort((a, b) => 
            new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
        );

        const firstDate = new Date(sortedSessions[0].start_datetime).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        });

        if (sortedSessions.length === 1) {
            return firstDate;
        } else {
            return `${sortedSessions.length} Sessions • Starts ${firstDate}`;
        }
    };

    const isStatusOpen = resource.status?.toLowerCase() === 'open';

    return (
        <Link to={`/resource/${resource.resource_id}`} className="block h-full w-full group">
            <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group-hover:shadow-lg group-hover:border-primary-300 transition-all duration-300">
                
                {/* Image Placeholder area */}
                <div className="relative h-44 bg-slate-100 w-full flex items-center justify-center border-b border-slate-100">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    
                    {/* NEW: Probability / Match Score Badge (Top Left) */}
                    {matchPercentage !== null && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm border border-white/40 z-10">
                            {/* Little spark/lightning icon for AI recommendation */}
                            <svg className="w-3.5 h-3.5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-extrabold text-slate-800">
                                {matchPercentage}% Match
                            </span>
                        </div>
                    )}

                    {/* Existing: Type Badge (Top Right) */}
                    <span className="absolute top-4 right-4 bg-primary-50 text-primary-700 border border-primary-100 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm z-10">
                        {resource.type || 'Event'}
                    </span>
                </div>
                
                {/* Card Content */}
                <div className="p-6 flex flex-col grow">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                            {resource.name}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {resource.description}
                        </p>
                    </div>
                    
                    {/* Footer Row */}
                    <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                        
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>{getScheduleText()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <span className="relative flex h-2.5 w-2.5">
                                {isStatusOpen && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-600 opacity-40"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStatusOpen ? 'bg-success-600' : 'bg-slate-400'}`}></span>
                            </span>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                {resource.status || 'Unknown'}
                            </span>
                        </div>
                        
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default ResourceCard;