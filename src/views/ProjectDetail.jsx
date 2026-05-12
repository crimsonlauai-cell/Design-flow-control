import { useParams, Link } from 'react-router-dom';
import { getProjectById } from '../data/mockProjects';
import { Layers, FileClock, ChevronRight, AlertCircle } from 'lucide-react';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const project = getProjectById(projectId);

  if (!project) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Project Not Found</h2>
        <Link to="/" className="text-brand hover:underline mt-2 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="border-b pb-6">
        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-brand transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium">{project.id}</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{project.name}</h2>
        <p className="text-slate-600">{project.description}</p>
      </div>

      {/* Packages List */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-800 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-brand" />
          Submission Packages
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {project.packages.map(pkg => (
            <div key={pkg.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-slate-700">{pkg.name}</h4>
                <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                  {pkg.submissions.length} Submissions
                </span>
              </div>
              
              <div className="p-0">
                {pkg.submissions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm">
                    No submissions initiated for this package yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {pkg.submissions.map((sub, idx) => (
                      <li key={sub.id}>
                        <Link 
                          to={`/project/${project.id}/package/${pkg.id}/submission/${sub.id}`}
                          className="flex items-center justify-between px-6 py-4 hover:bg-brand-light/30 transition-colors group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="bg-brand/10 p-2 rounded-md text-brand">
                              <FileClock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 group-hover:text-brand transition-colors">
                                {sub.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Created: {sub.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                              sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                              sub.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                              sub.status === 'Approved with Comments' ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {sub.status}
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand transition-colors" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
