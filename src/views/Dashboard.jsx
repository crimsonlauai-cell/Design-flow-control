import { Link } from 'react-router-dom';
import { mockProjects } from '../data/mockProjects';
import { FolderGit2, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">Project Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Select a project or tender to view design submission packages.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map(project => (
          <Link 
            key={project.id} 
            to={`/project/${project.id}`}
            className="block group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-brand transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-brand-light rounded-lg text-brand">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                project.type === 'Tender' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {project.type}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand transition-colors">
              {project.id}
            </h3>
            <p className="text-sm font-medium text-slate-600 mb-2 truncate">
              {project.name.replace(`${project.type} ${project.id} - `, '')}
            </p>
            <p className="text-xs text-slate-500 line-clamp-2 mb-4">
              {project.description}
            </p>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-500">
                {project.packages.length} Packages
              </span>
              <span className="flex items-center text-sm font-medium text-brand">
                View Details <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
