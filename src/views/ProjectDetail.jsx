import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProjectById } from '../data/mockProjects';
import { Layers, FileClock, ChevronRight, AlertCircle, Calendar, Save, Edit, Clock, Plus, X } from 'lucide-react';
import axios from 'axios';

// Helper to post data to Google Apps Script bypassing CORS OPTIONS Preflight
const postToGAS = (url, data) => {
  return axios.post(url, JSON.stringify(data), {
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    }
  });
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const project = getProjectById(projectId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [scopesData, setScopesData] = useState({
    Foundation: { checked: false, start: '', end: '' },
    'Pile Cap': { checked: false, start: '', end: '' },
    ELS: { checked: false, start: '', end: '' },
    Hoarding: { checked: false, start: '', end: '' },
    'Steel Platform': { checked: false, start: '', end: '' },
    Others: { checked: false, start: '', end: '', customName: '' },
  });

  const [packages, setPackages] = useState([]);
  
  // Modal 狀態
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalScope, setModalScope] = useState('');
  const [modalStage, setModalStage] = useState('1st Submission');

  const apiUrl = import.meta.env.VITE_GAS_API_URL;
  const isLocalMode = !apiUrl || apiUrl.includes('YOUR_DEPLOYMENT_ID');

  // 初始化 packages 列表為空（預設所有專案一開始都沒有任何 submission）
  useEffect(() => {
    if (project) {
      const defaultPkgs = project.packages ? project.packages.map(p => ({ ...p, submissions: [] })) : [];
      setPackages(defaultPkgs);
    }
  }, [project]);

  // 加載 Timeline 與 Packages 數據（以雲端資料為唯一真相 Source of Truth）
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!project) return;
      
      const timelineKey = `design_flow_state_${projectId}_project_timeline`;
      const packagesKey = `design_flow_project_packages_${projectId}`;
      
      // 1. 為了網路加載過渡，先讀取本地快取
      const cachedTimeline = localStorage.getItem(timelineKey);
      if (cachedTimeline) {
        try {
          const parsed = JSON.parse(cachedTimeline);
          if (parsed.scopesData) {
            setScopesData(parsed.scopesData);
            const hasChecked = Object.values(parsed.scopesData).some(s => s.checked);
            setIsEditing(!hasChecked);
          }
        } catch (e) {
          console.error('Failed to parse cached timeline:', e);
        }
      }

      const cachedPackages = localStorage.getItem(packagesKey);
      if (cachedPackages) {
        try {
          const parsed = JSON.parse(cachedPackages);
          if (parsed.packages) {
            setPackages(parsed.packages);
          }
        } catch (e) {
          console.error('Failed to parse cached packages:', e);
        }
      }

      if (isLocalMode) {
        setIsLoading(false);
        return;
      }

      // 2. 雲端加載，作為最終真值 (Source of Truth)
      setIsLoading(true);
      
      // 獨立獲取 Timeline
      try {
        const resTimeline = await axios.get(apiUrl, { 
          params: { action: 'getState', projectId, packageId: 'project', submissionId: 'timeline' } 
        });
        if (resTimeline.data && resTimeline.data.status === 'success' && resTimeline.data.stateData) {
          const s = resTimeline.data.stateData;
          if (s.scopesData) {
            setScopesData(s.scopesData);
            const hasChecked = Object.values(s.scopesData).some(sc => sc.checked);
            setIsEditing(!hasChecked);
            localStorage.setItem(timelineKey, JSON.stringify(s));
          }
        } else if (resTimeline.data && resTimeline.data.status === 'not_found') {
          // 雲端無 Timeline，重設本機狀態為空編輯模式
          const emptyTimeline = {
            Foundation: { checked: false, start: '', end: '' },
            'Pile Cap': { checked: false, start: '', end: '' },
            ELS: { checked: false, start: '', end: '' },
            Hoarding: { checked: false, start: '', end: '' },
            'Steel Platform': { checked: false, start: '', end: '' },
            Others: { checked: false, start: '', end: '', customName: '' },
          };
          setScopesData(emptyTimeline);
          setIsEditing(true);
          localStorage.setItem(timelineKey, JSON.stringify({ scopesData: emptyTimeline }));
        }
      } catch (err) {
        console.error('Failed to load timeline from cloud DB:', err);
      }

      // 獨立獲取 Packages
      try {
        const resPackages = await axios.get(apiUrl, { 
          params: { action: 'getState', projectId, packageId: 'project', submissionId: 'packages' } 
        });
        if (resPackages.data && resPackages.data.status === 'success' && resPackages.data.stateData) {
          const s = resPackages.data.stateData;
          if (s.packages) {
            setPackages(s.packages);
            localStorage.setItem(packagesKey, JSON.stringify(s));
          }
        } else if (resPackages.data && resPackages.data.status === 'not_found') {
          // 雲端無 Packages，重設為空列表
          const emptyPkgs = project.packages ? project.packages.map(p => ({ ...p, submissions: [] })) : [];
          setPackages(emptyPkgs);
          localStorage.setItem(packagesKey, JSON.stringify({ packages: emptyPkgs }));
        }
      } catch (err) {
        console.error('Failed to load packages from cloud DB:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectData();
  }, [projectId, project, isLocalMode, apiUrl]);

  const handleSaveTimeline = async () => {
    const localKey = `design_flow_state_${projectId}_project_timeline`;
    setIsSaving(true);
    const stateData = { scopesData };
    
    try {
      localStorage.setItem(localKey, JSON.stringify(stateData));
    } catch (e) {
      console.error('Failed to save timeline to localStorage:', e);
    }

    if (isLocalMode) {
      alert('已成功保存至本地瀏覽器！');
      setIsSaving(false);
      setIsEditing(false);
      return;
    }

    try {
      const res = await postToGAS(apiUrl, {
        action: 'saveState',
        projectId,
        packageId: 'project',
        submissionId: 'timeline',
        stateData
      });
      if (res.data && res.data.status === 'success') {
        alert('成功儲存 Timeline 至雲端資料庫！');
        setIsEditing(false);
      } else {
        throw new Error(res.data.message || 'Error saving state');
      }
    } catch (err) {
      console.error('Failed to save timeline to cloud database:', err);
      const errMsg = err.response?.data?.message || err.message;
      alert(`儲存至雲端失敗（錯誤原因：${errMsg}），已為你自動降級保存至本地瀏覽器中。`);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubmission = async (selectedScope, selectedStage) => {
    let updatedPackages = [...packages];
    
    // 尋找是否已有該 scope 的 package
    let pkg = updatedPackages.find(p => p.id.toLowerCase() === selectedScope.toLowerCase() || p.name.toLowerCase() === selectedScope.toLowerCase());
    if (!pkg) {
      pkg = { id: selectedScope, name: selectedScope, submissions: [] };
      updatedPackages.push(pkg);
    }
    
    // 新增 submission
    const newSubmission = {
      id: `sub-${Date.now()}`,
      name: selectedStage,
      date: new Date().toISOString().split('T')[0],
      status: 'Drafting'
    };
    pkg.submissions = [...pkg.submissions, newSubmission];
    
    setPackages(updatedPackages);
    
    // 持久化儲存
    const localKey = `design_flow_project_packages_${projectId}`;
    localStorage.setItem(localKey, JSON.stringify({ packages: updatedPackages }));
    
    if (isLocalMode) {
      alert('成功新增 Submission，目前保存於本地瀏覽器！');
      return;
    }

    try {
      const res = await postToGAS(apiUrl, {
        action: 'saveState',
        projectId,
        packageId: 'project',
        submissionId: 'packages',
        stateData: { packages: updatedPackages }
      });
      if (res.data && res.data.status === 'success') {
        alert('成功新增 Submission，並同步儲存至雲端資料庫！');
      } else {
        throw new Error(res.data.message || 'Error syncing packages');
      }
    } catch (err) {
      console.error('Failed to sync packages with database:', err);
      const errMsg = err.response?.data?.message || err.message;
      alert(`新增成功，但同步至雲端失敗（錯誤原因：${errMsg}），已為你保存於本地瀏覽器。`);
    }
  };

  const handleScopeCheckboxChange = (scope, checked) => {
    setScopesData(prev => ({
      ...prev,
      [scope]: { ...prev[scope], checked }
    }));
  };

  const handleScopeDateChange = (scope, type, value) => {
    setScopesData(prev => ({
      ...prev,
      [scope]: { ...prev[scope], [type]: value }
    }));
  };

  const handleScopeCustomNameChange = (value) => {
    setScopesData(prev => ({
      ...prev,
      Others: { ...prev.Others, customName: value }
    }));
  };

  // 獲取目前 Timeline 中被勾選啟用的 Scope 名稱清單
  const activeScopes = Object.entries(scopesData)
    .filter(([_, data]) => data.checked)
    .map(([name, data]) => name === 'Others' ? (data.customName || 'Others') : name);

  // 下方的 Packages 清單動態與 activeScopes 綁定
  const visiblePackages = activeScopes.map(scopeName => {
    const existingPkg = packages.find(p => p.name.toLowerCase() === scopeName.toLowerCase() || p.id.toLowerCase() === scopeName.toLowerCase());
    return {
      id: existingPkg ? existingPkg.id : scopeName,
      name: scopeName,
      submissions: existingPkg ? existingPkg.submissions : []
    };
  });

  const stages = [
    '1st Submission',
    '1st Amendment',
    '2nd Amendment',
    '3rd Amendment',
    '4th Amendment',
    '5th Amendment',
    '6th Amendment',
    '7th Amendment',
    '8th Amendment',
    '9th Amendment',
    '10th Amendment'
  ];

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
    <div className="space-y-8 relative">
      {/* Local Mode Warning Banner */}
      {isLocalMode && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm flex items-start space-x-3 animate-pulse duration-1000">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <strong className="block font-bold">⚠️ 當前系統正運行於【本地測試模式】</strong>
            <span className="block mt-0.5 leading-relaxed text-xs text-amber-700">
              您的 Timeline、新增的 Submission 以及上傳的文件均儲存於您的本機瀏覽器中，其他人進入網頁無法看到或進行協同。
              請按照說明部署你的 <strong>Google Apps Script</strong> 並將網頁應用程式 URL 貼給 AI 或填入本地 <code>.env</code> 檔案中以開啟真實協作。
            </span>
          </div>
        </div>
      )}

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

      {/* Project Timeline & Scopes Panel */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-brand" />
            Project Scope Timeline Setup
          </h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit Timeline
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-2"></div>
            <p className="text-xs text-slate-400">Loading timeline...</p>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">Select the scopes for this project and configure their expected start and end dates.</p>
            
            <div className="grid grid-cols-12 gap-4 mb-2 px-2 hidden md:grid border-b border-slate-100 pb-2">
              <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope of Works</div>
              <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Start Date</div>
              <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected End Date</div>
            </div>

            {['Foundation', 'Pile Cap', 'ELS', 'Hoarding', 'Steel Platform', 'Others'].map((scope) => {
              const isChecked = scopesData[scope]?.checked || false;
              return (
                <div key={scope} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-md">
                  <div className="col-span-4 font-medium text-slate-700 text-sm flex flex-col justify-start pt-2">
                    <label className="flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleScopeCheckboxChange(scope, e.target.checked)}
                        className="mr-2 rounded border-slate-300 text-brand focus:ring-brand w-4 h-4"
                      />
                      <span>{scope}</span>
                    </label>
                    {scope === 'Others' && isChecked && (
                      <input 
                        type="text"
                        placeholder="Please specify other scope..."
                        value={scopesData['Others']?.customName || ''}
                        onChange={(e) => handleScopeCustomNameChange(e.target.value)}
                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800"
                      />
                    )}
                  </div>
                  <div className="col-span-4">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-semibold block mb-1">Expected Start Date</span>
                    <input 
                      type="date" 
                      disabled={!isChecked}
                      value={scopesData[scope]?.start || ''}
                      onChange={(e) => handleScopeDateChange(scope, 'start', e.target.value)}
                      className={`w-full rounded-md border px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800 ${
                        isChecked ? "border-slate-300" : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="col-span-4">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-semibold block mb-1">Expected End Date</span>
                    <input 
                      type="date" 
                      disabled={!isChecked}
                      value={scopesData[scope]?.end || ''}
                      onChange={(e) => handleScopeDateChange(scope, 'end', e.target.value)}
                      className={`w-full rounded-md border px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800 ${
                        isChecked ? "border-slate-300" : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              {Object.values(scopesData).some(s => s.checked) && (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleSaveTimeline}
                disabled={isSaving}
                className="flex items-center px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-md text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Timeline"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(scopesData)
                .filter(([_, data]) => data.checked)
                .map(([name, data]) => {
                  const displayName = name === 'Others' ? (data.customName || 'Others') : name;
                  let durationDays = null;
                  if (data.start && data.end) {
                    const start = new Date(data.start);
                    const end = new Date(data.end);
                    const diffTime = Math.abs(end - start);
                    durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  }
                  return (
                    <div key={name} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all duration-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-brand"></div>
                      <div className="font-bold text-slate-800 text-base mb-2 pl-1">{displayName}</div>
                      <div className="space-y-1 text-sm text-slate-600 pl-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-slate-400" />
                          <span>Start: <strong>{data.start || 'N/A'}</strong></span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-slate-400" />
                          <span>End: <strong>{data.end || 'N/A'}</strong></span>
                        </div>
                        {durationDays && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Duration:</span>
                            <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">{durationDays} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Packages List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-brand" />
            Submission Packages
          </h3>
          <button
            onClick={() => {
              if (activeScopes.length === 0) {
                alert('請先在上方「Project Scope Timeline Setup」中勾選並啟用至少一個工作範疇 (Scope)，並點擊 Save Timeline 保存！');
                return;
              }
              const defaultScope = activeScopes[0];
              setModalScope(defaultScope);
              setModalStage('1st Submission');
              setShowAddModal(true);
            }}
            className="flex items-center px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95 hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Submission Package
          </button>
        </div>
        
        {visiblePackages.length === 0 ? (
          <div className="text-center py-12 px-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="bg-slate-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-slate-700 font-bold text-sm">無已啟用的工作範疇</h4>
            <p className="text-xs text-slate-500 mt-1">請先在上方 Timeline 點擊 「Edit Timeline」 勾選並儲存工種以開啟 Submission 流程。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {visiblePackages.map(pkg => (
              <div key={pkg.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-slate-700">{pkg.name}</h4>
                  <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                    {pkg.submissions.length} Submissions
                  </span>
                </div>
                
                <div className="p-0">
                  {pkg.submissions.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-400 text-xs font-medium">
                      暫無此工種的 Submission。請點選右上角按鍵新增流程。
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
                                <p className="font-semibold text-slate-800 group-hover:text-brand transition-colors text-sm">
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
        )}
      </div>

      {/* Add Submission Modal (Glassmorphism popup) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 flex items-center">
                <Plus className="w-5 h-5 mr-1.5 text-brand" />
                Add Submission Package
              </h4>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Scope of Works</label>
                <select 
                  value={modalScope} 
                  onChange={(e) => setModalScope(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50/50 text-slate-800 font-medium"
                >
                  {activeScopes.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Submission Stage</label>
                <select 
                  value={modalStage} 
                  onChange={(e) => setModalStage(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50/50 text-slate-800 font-medium"
                >
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const targetScope = modalScope || activeScopes[0];
                  handleAddSubmission(targetScope, modalStage);
                  setShowAddModal(false);
                }}
                className="flex items-center px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
              >
                Create Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
