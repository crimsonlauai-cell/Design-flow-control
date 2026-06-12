import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProjectById } from '../data/mockProjects';
import Timeline from '../components/Timeline';
import StepViews from './StepViews';
import { ChevronRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function TimelineView() {
  const { projectId, packageId, submissionId } = useParams();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const project = getProjectById(projectId);

  useEffect(() => {
    if (!project) return;
    
    const packagesKey = `design_flow_project_packages_${projectId}`;
    
    // 1. Load local cache first
    const cached = localStorage.getItem(packagesKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.packages) {
          setPackages(parsed.packages);
        }
      } catch (e) {
        console.error('Failed to parse cached packages in TimelineView:', e);
      }
    } else {
      const defaultPkgs = project.packages ? project.packages.map(p => ({ ...p, submissions: [] })) : [];
      setPackages(defaultPkgs);
    }

    const apiUrl = import.meta.env.VITE_GAS_API_URL;
    const isLocalMode = !apiUrl || apiUrl.includes('YOUR_DEPLOYMENT_ID');

    if (isLocalMode) {
      setIsLoading(false);
      return;
    }

    // 2. Fetch latest packages from GAS for multi-user sync
    const fetchPackages = async () => {
      try {
        const res = await axios.get(apiUrl, {
          params: { action: 'getState', projectId, packageId: 'project', submissionId: 'packages' }
        });
        if (res.data && res.data.status === 'success' && res.data.stateData) {
          const s = res.data.stateData;
          if (s.packages) {
            setPackages(s.packages);
            localStorage.setItem(packagesKey, JSON.stringify(s));
          }
        }
      } catch (err) {
        console.error('Failed to sync packages in TimelineView:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, [projectId, project]);

  // Find corresponding Package & Submission dynamically
  const pkg = packages.find(
    p => p.id.toLowerCase() === packageId.toLowerCase() || p.name.toLowerCase() === packageId.toLowerCase()
  );
  const submission = pkg?.submissions.find(s => s.id === submissionId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-2"></div>
        <p className="text-xs text-slate-400">Loading submission details...</p>
      </div>
    );
  }

  if (!project || !pkg || !submission) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-lg shadow-sm">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Submission Not Found</h2>
        <Link to="/" className="text-brand hover:underline mt-2 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center space-x-2 text-sm text-slate-500 mb-2">
        <Link to="/" className="hover:text-brand transition-colors">Dashboard</Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <Link to={`/project/${project.id}`} className="hover:text-brand transition-colors whitespace-nowrap">{project.id}</Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="whitespace-nowrap">{pkg.name}</span>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-800 font-medium whitespace-nowrap">{submission.name}</span>
      </div>

      <div className="bg-white border-b border-slate-200 shadow-sm z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-8 sticky top-0">
        <Timeline />
      </div>

      <div>
        <StepViews />
      </div>
    </div>
  );
}

