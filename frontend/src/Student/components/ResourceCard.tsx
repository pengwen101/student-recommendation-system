import { Link } from 'react-router-dom';
import type { ResourceRecommendation, ResourceEvent, ResourceBook, ResourceVideo, Session } from '../../types';

// --- HELPERS ---

// Helper for exact character truncation
const truncateText = (text: string | undefined, maxLength: number = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    // Slice to max length, trim trailing spaces, and add ellipsis
    return text.slice(0, maxLength).trim() + "...";
};

// Helper for Event Dates (Start and End)
const getEventDateText = (sessions?: Session[]) => {
    if (!sessions || sessions.length === 0) return "Date TBD";
    
    // Sort to find the earliest start date
    const sortedByStart = [...sessions].sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
    const startDate = new Date(sortedByStart[0].start_datetime);

    // Sort to find the latest end date
    const sortedByEnd = [...sessions].sort((a, b) => 
        new Date(b.end_datetime).getTime() - new Date(a.end_datetime).getTime()
    );
    const endDate = new Date(sortedByEnd[0].end_datetime);

    const startStr = startDate.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
    });
    
    const endStr = endDate.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
    });

    // If it starts and ends on the same day, just return the single date
    if (startStr === endStr) {
        return startStr;
    }

    return `${startStr} - ${endStr}`;
};


// --- COMPONENT ---
export default function ResourceCard({ resource, relative_score }: ResourceRecommendation) {
    
    const relativeScorePct = relative_score !== undefined && relative_score !== null 
        ? Math.round(relative_score * 100) 
        : null;

    // --- RENDER HELPERS ---

    const renderEventDetails = (res: ResourceEvent) => {
        const isStatusOpen = res.status?.toLowerCase() === 'open';

        return (
            <div className="flex flex-col gap-2 text-sm text-slate-600 h-full">
                <div className="font-semibold text-slate-500">{getEventDateText(res.sessions)}</div>
                <div className="leading-relaxed flex-grow">
                    {truncateText(res.description, 110)}
                </div>
                
                <div className="mt-auto pt-2 border-t border-slate-200">
                    <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 w-fit">
                        <span className="relative flex h-2.5 w-2.5">
                            {isStatusOpen && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStatusOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            {res.status || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const renderBookDetails = (res: ResourceBook) => (
        <div className="flex flex-col gap-1 text-sm text-slate-600 h-full">
            <div className="font-semibold text-slate-500 italic">
                By {res.authors && res.authors.length > 0 ? res.authors.join(', ') : 'Unknown Author'}
            </div>
            <div className="leading-relaxed mt-1 flex-grow">
                {truncateText(res.description, 120)}
            </div>
        </div>
    );

    const renderVideoDetails = (res: ResourceVideo) => (
        <div className="flex flex-col gap-1 text-sm text-slate-600 h-full">
            <div className="leading-relaxed flex-grow">
                {truncateText(res.description, 140)}
            </div>
        </div>
    );

    const renderArticleDetails = () => (
        <div className="flex flex-col gap-1 text-sm text-slate-500 italic mt-auto h-full">
             <div className="flex-grow"></div>
             <div>Click to read full article &rarr;</div>
        </div>
    );

    return (
        <Link to={`/resource/${resource.resource_id}`} className="block h-full w-full group">
            <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 relative p-6">
                
                {/* AI Match Badge */}
                {relativeScorePct !== null && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-slate-200 z-10">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-extrabold text-slate-800">
                            {relativeScorePct}%
                        </span>
                    </div>
                )}

                {/* Card Title - Switched to leading-normal and added pb-1 to fix descender cutoff */}
                <h3 className="text-xl font-bold text-slate-800 leading-normal mb-2 pr-8 pb-1 line-clamp-2">
                    {resource.title}
                </h3>

                {/* Conditional Rendering based on Type */}
                <div className="flex flex-col grow">
                    {resource.type === 'event' && renderEventDetails(resource as ResourceEvent)}
                    {resource.type === 'book' && renderBookDetails(resource as ResourceBook)}
                    {resource.type === 'video' && renderVideoDetails(resource as ResourceVideo)}
                    {resource.type === 'article' && renderArticleDetails()}
                </div>

            </div>
        </Link>
    );
}