import type { ResourceRecommendation } from "../../types";
import { Link } from 'react-router-dom'

function ResourceCard( props: ResourceRecommendation ) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link to={"/resource/" + props.resource.resource_id}>
      <div className="w-75 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-40 bg-slate-500 w-full flex items-center justify-center">
          <span className="text-slate-300 text-sm">Placeholder for image</span>
          <span className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {props.resource.type || 'Video'}
          </span>
        </div>
        <div className="p-5 flex flex-col grow">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
              {props.resource.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {props.resource.description}
            </p>
          </div>
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>{formatDate(props.resource.start_datetime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-gray-700 capitalize">
                {props.resource.status}
              </span>
            </div>
            
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ResourceCard;
