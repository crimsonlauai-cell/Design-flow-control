import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProjectById } from '../data/mockProjects';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, MessageSquare, Save, Link as LinkIcon, Image as ImageIcon, AlertCircle, Calendar, Bell, ShieldCheck, DollarSign, Send, Clock } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';

// Helper to post data to Google Apps Script bypassing CORS OPTIONS Preflight
const postToGAS = (url, data) => {
  return axios.post(url, JSON.stringify(data), {
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    }
  });
};

// IndexedDB Helper for Local Mode File Storage
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DesignFlowDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const saveFileToIndexedDB = async (id, base64Content, mimeType) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.put({ id, base64Content, mimeType });
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('IndexedDB save failed:', err);
    return false;
  }
};

const getFileFromIndexedDB = async (id) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(id);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('IndexedDB get failed:', err);
    return null;
  }
};

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6 ${className}`}>
      <h3 className="text-lg font-bold text-brand mb-6 border-b pb-3">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, type = 'text', defaultValue, value, onChange, colSpan = 1 }) {
  const inputProps = value !== undefined ? { value, onChange } : { defaultValue };
  return (
    <div className={`mb-4 ${colSpan > 1 ? `col-span-${colSpan}` : ''}`}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea 
          {...inputProps}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50/50"
        />
      ) : (
        <input 
          type={type} 
          {...inputProps}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50/50 text-slate-800"
        />
      )}
    </div>
  );
}

function Button({ children, variant = 'primary', icon: Icon, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
      "flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95",
      variant === 'primary' ? "bg-brand text-white hover:bg-brand-dark hover:shadow-md" : 
      variant === 'secondary' ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400" :
      "bg-status-green text-white hover:bg-emerald-600 hover:shadow-md"
    )}>
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
}

const getDynamicProject = (projectId) => {
  const baseProject = getProjectById(projectId);
  if (!baseProject) return null;
  const localKey = `design_flow_project_packages_${projectId}`;
  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.packages) {
        return { ...baseProject, packages: parsed.packages };
      }
    } catch (e) {
      console.error('Failed to parse cached dynamic project:', e);
    }
  }
  return baseProject;
};

export default function StepViews() {
  const { currentStep, currentRole, steps, markStepActive } = useAppContext();
  const { projectId, packageId, submissionId } = useParams();
  
  const stepInfo = steps.find(s => s.id === currentStep);
  const project = getDynamicProject(projectId) || {};
  const details = project.details || {};

  const pkg = project.packages?.find(p => p.id === packageId) || {};
  const submission = pkg.submissions?.find(s => s.id === submissionId) || {};

  const [submissionDate, setSubmissionDate] = useState('');
  const [approvalDate, setApprovalDate] = useState('');
  const [isFirstSubmission, setIsFirstSubmission] = useState(submission?.name?.includes('1st Submission') || false);

  // Step 3: Controlled inputs states for database sync
  const [packageTitle, setPackageTitle] = useState(`${pkg.name || ''} - ${submission.name || ''}`);
  const [purposeContext, setPurposeContext] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDesignDate, setTargetDesignDate] = useState('');
  const [targetReviewDate, setTargetReviewDate] = useState('');
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);



  const [inputProvider, setInputProvider] = useState('Client');
  const [inputReceiveDate, setInputReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadedInputs, setUploadedInputs] = useState([]);
  const [isUploadingInput, setIsUploadingInput] = useState(false);
  const [step5Tab, setStep5Tab] = useState('draft');
  const [step6Tab, setStep6Tab] = useState('formal');

  const [drafts, setDrafts] = useState([]);
  const [isDraftNotified, setIsDraftNotified] = useState(false);

  const [comments, setComments] = useState([
    {
      id: 'COM-001',
      authorRole: 'QS',
      time: 'Today 10:30 AM',
      severity: 'Critical',
      content: 'Cost estimation for the pile caps exceeds the approved budget by 15%. Need immediate review of reinforcement density.',
      targetDraft: 'D0',
      reply: null,
      hasImage: false
    }
  ]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextId, setReplyTextId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [commentTargetDraft, setCommentTargetDraft] = useState('');

  const [formalSubmissions, setFormalSubmissions] = useState([]);
  const [issueRound, setIssueRound] = useState('C1');
  const [transmittalRef, setTransmittalRef] = useState('TR-2026-001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 16));
  const [issueMethod, setIssueMethod] = useState('Aconex e-Platform');
  const [uploadRef, setUploadRef] = useState('');
  const [formalSubmissionFile, setFormalSubmissionFile] = useState(null);

  // Step 8: Consultant Feedback Log
  const [consultantFeedbacks, setConsultantFeedbacks] = useState([]);
  const [cfReceivedDate, setCfReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [cfFile, setCfFile] = useState(null);
  const [cfDescription, setCfDescription] = useState('');
  const [cfReplyId, setCfReplyId] = useState(null);
  const [cfReplyText, setCfReplyText] = useState('');
  const [cfReplyImage, setCfReplyImage] = useState(null);

  // Step 9: Statutory Submission Tracking
  const [statutorySubmissions, setStatutorySubmissions] = useState([]);
  const [ssRtcComplete, setSsRtcComplete] = useState(false);
  const [ssVersion, setSsVersion] = useState('BD-1st-Sub');
  const [ssDrawingsFile, setSsDrawingsFile] = useState(null);
  const [ssReportFile, setSsReportFile] = useState(null);
  const [ssReplyDate, setSsReplyDate] = useState('');
  const [ssSubmittedDate, setSsSubmittedDate] = useState('');
  const [ssNotifyDue, setSsNotifyDue] = useState(false);
  
  // Step 10: Authority Comment Processing
  const [authorityComments, setAuthorityComments] = useState([]);
  const [acReceivedDate, setAcReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [acFile, setAcFile] = useState(null);
  const [acDescription, setAcDescription] = useState('');
  const [acReplyId, setAcReplyId] = useState(null);
  const [acReplyText, setAcReplyText] = useState('');
  const [acReplyImage, setAcReplyImage] = useState(null);

  // Step 11: Final Response Submission
  const [finalResponses, setFinalResponses] = useState([]);
  const [frDrawingsCount, setFrDrawingsCount] = useState(0);
  const [frDrawingsFile, setFrDrawingsFile] = useState(null);
  const [frReportFile, setFrReportFile] = useState(null);

  // Step 12: Approval & Record Register
  const [approvals, setApprovals] = useState([]);
  const [appStatus, setAppStatus] = useState('Approved');
  const [appDate, setAppDate] = useState(new Date().toISOString().slice(0, 10));
  const [appRef, setAppRef] = useState('');
  const [appDrawingsFile, setAppDrawingsFile] = useState(null);
  const [appPdf, setAppPdf] = useState(null);
  const [appConditions, setAppConditions] = useState('');

  // Step 13: Quantity & Cost Tracking
  const [costTrackings, setCostTrackings] = useState([]);
  const [ctCostImpact, setCtCostImpact] = useState('');
  const [ctScheduleImpact, setCtScheduleImpact] = useState('');

  // Step 2: Key Person states
  const isTarget = projectId === 'P4010B' && 
                   packageId?.toLowerCase() === 'foundation' && 
                   (submissionId === 'sub-1' || 
                    submissionId === 'sub-1-1st-submission' || 
                    submission?.name?.toLowerCase() === '1st submission');

  const [kpPD, setKpPD] = useState(isTarget ? 'Lau Shing Chi (Crimson)' : '');
  const [kpEIC, setKpEIC] = useState(isTarget ? 'Wai Hon Man' : '');
  const [kpPIC, setKpPIC] = useState(isTarget ? 'Wong Lok Kwan (Lok)' : '');
  const [kpSafety, setKpSafety] = useState(isTarget ? 'So Ming Lok (Edvard)' : '');
  const [kpSiteRep, setKpSiteRep] = useState(isTarget ? 'Chiu Kin Wing' : '');
  const [kpQA, setKpQA] = useState(isTarget ? 'Chan Yuet Man (Moon)、Ng Yui Yau (Oceanna)' : '');
  const [kpDesign, setKpDesign] = useState(isTarget ? 'Chan Wai Lok (Mars)' : '');
  const [kpSec, setKpSec] = useState(isTarget ? 'Tam Kit Yi (Kit)' : '');
  const [kpPQS, setKpPQS] = useState(isTarget ? 'Cheung Yee Man (Tobey)' : '');
  const [kpPlantRep, setKpPlantRep] = useState('');
  const [kpProcurement, setKpProcurement] = useState(isTarget ? 'Lun Yik Wun (Rachel)' : '');
  const [kpElectrician, setKpElectrician] = useState('');
  const [kpSupervisorEngineer, setKpSupervisorEngineer] = useState('');
  const [kpAdminStaff, setKpAdminStaff] = useState('');
  const [kpOthersStaff, setKpOthersStaff] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const applyState = (s) => {
    if (s.submissionDate) setSubmissionDate(s.submissionDate);
    if (s.approvalDate) setApprovalDate(s.approvalDate);
    if (s.isFirstSubmission !== undefined) setIsFirstSubmission(s.isFirstSubmission);
    if (s.packageTitle) setPackageTitle(s.packageTitle);
    if (s.purposeContext) setPurposeContext(s.purposeContext);
    if (s.startDate) setStartDate(s.startDate);
    if (s.targetDesignDate) setTargetDesignDate(s.targetDesignDate);
    if (s.targetReviewDate) setTargetReviewDate(s.targetReviewDate);
    if (s.supportingDocs) setSupportingDocs(s.supportingDocs);
    if (s.uploadedInputs) setUploadedInputs(s.uploadedInputs);
    if (s.drafts) setDrafts(s.drafts);
    if (s.isDraftNotified !== undefined) setIsDraftNotified(s.isDraftNotified);
    if (s.comments) setComments(s.comments);
    if (s.formalSubmissions) setFormalSubmissions(s.formalSubmissions);
    if (s.consultantFeedbacks) setConsultantFeedbacks(s.consultantFeedbacks);
    if (s.statutorySubmissions) setStatutorySubmissions(s.statutorySubmissions);
    if (s.authorityComments) setAuthorityComments(s.authorityComments);
    if (s.finalResponses) setFinalResponses(s.finalResponses);
    if (s.approvals) setApprovals(s.approvals);
    if (s.costTrackings) setCostTrackings(s.costTrackings);

    // Step 2 with fallback if undefined to preserve defaults
    setKpPD(s.kpPD !== undefined ? s.kpPD : (isTarget ? 'Lau Shing Chi (Crimson)' : ''));
    setKpEIC(s.kpEIC !== undefined ? s.kpEIC : (isTarget ? 'Wai Hon Man' : ''));
    setKpPIC(s.kpPIC !== undefined ? s.kpPIC : (isTarget ? 'Wong Lok Kwan (Lok)' : ''));
    setKpSafety(s.kpSafety !== undefined ? s.kpSafety : (isTarget ? 'So Ming Lok (Edvard)' : ''));
    setKpSiteRep(s.kpSiteRep !== undefined ? s.kpSiteRep : (isTarget ? 'Chiu Kin Wing' : ''));
    setKpQA(s.kpQA !== undefined ? s.kpQA : (isTarget ? 'Chan Yuet Man (Moon)、Ng Yui Yau (Oceanna)' : ''));
    setKpDesign(s.kpDesign !== undefined ? s.kpDesign : (isTarget ? 'Chan Wai Lok (Mars)' : ''));
    setKpSec(s.kpSec !== undefined ? s.kpSec : (isTarget ? 'Tam Kit Yi (Kit)' : ''));
    setKpPQS(s.kpPQS !== undefined ? s.kpPQS : (isTarget ? 'Cheung Yee Man (Tobey)' : ''));
    setKpPlantRep(s.kpPlantRep !== undefined ? s.kpPlantRep : '');
    setKpProcurement(s.kpProcurement !== undefined ? s.kpProcurement : (isTarget ? 'Lun Yik Wun (Rachel)' : ''));
    setKpElectrician(s.kpElectrician !== undefined ? s.kpElectrician : '');
    setKpSupervisorEngineer(s.kpSupervisorEngineer !== undefined ? s.kpSupervisorEngineer : '');
    setKpAdminStaff(s.kpAdminStaff !== undefined ? s.kpAdminStaff : '');
    setKpOthersStaff(s.kpOthersStaff !== undefined ? s.kpOthersStaff : '');
  };

  useEffect(() => {
    const fetchState = async () => {
      const apiUrl = import.meta.env.VITE_GAS_API_URL;
      const localKey = `design_flow_state_${projectId}_${packageId}_${submissionId}`;
      
      const setDefaultFields = () => {
        setKpPD(isTarget ? 'Lau Shing Chi (Crimson)' : '');
        setKpEIC(isTarget ? 'Wai Hon Man' : '');
        setKpPIC(isTarget ? 'Wong Lok Kwan (Lok)' : '');
        setKpSafety(isTarget ? 'So Ming Lok (Edvard)' : '');
        setKpSiteRep(isTarget ? 'Chiu Kin Wing' : '');
        setKpQA(isTarget ? 'Chan Yuet Man (Moon)、Ng Yui Yau (Oceanna)' : '');
        setKpDesign(isTarget ? 'Chan Wai Lok (Mars)' : '');
        setKpSec(isTarget ? 'Tam Kit Yi (Kit)' : '');
        setKpPQS(isTarget ? 'Cheung Yee Man (Tobey)' : '');
        setKpPlantRep('');
        setKpProcurement(isTarget ? 'Lun Yik Wun (Rachel)' : '');
        setKpElectrician('');
        setKpSupervisorEngineer('');
        setKpAdminStaff('');
        setKpOthersStaff('');
      };

      // 先從 localStorage 載入緩存以提供即時顯示
      const cached = localStorage.getItem(localKey);
      if (cached) {
        try {
          applyState(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached state:', e);
          setDefaultFields();
        }
      } else {
        setDefaultFields();
      }

      if (!apiUrl || apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        console.warn('API URL is not configured. Loaded only from localStorage.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await axios.get(apiUrl, {
          params: {
            action: 'getState',
            projectId,
            packageId,
            submissionId
          }
        });
        if (res.data && res.data.status === 'success' && res.data.stateData) {
          const s = res.data.stateData;
          applyState(s);
          // 同步更新本地緩存
          localStorage.setItem(localKey, JSON.stringify(s));
        } else if (res.data && res.data.status === 'not_found') {
          if (!cached) {
            setDefaultFields();
          }
        }
      } catch (err) {
        console.error('Failed to load state from database:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchState();
  }, [projectId, packageId, submissionId]);

  const syncWithDatabase = async (updatedFields = {}) => {
    const localKey = `design_flow_state_${projectId}_${packageId}_${submissionId}`;
    const apiUrl = import.meta.env.VITE_GAS_API_URL;

    markStepActive(currentStep);
    setIsSaving(true);
    const fullState = {
      submissionDate: updatedFields.hasOwnProperty('submissionDate') ? updatedFields.submissionDate : submissionDate,
      approvalDate: updatedFields.hasOwnProperty('approvalDate') ? updatedFields.approvalDate : approvalDate,
      isFirstSubmission: updatedFields.hasOwnProperty('isFirstSubmission') ? updatedFields.isFirstSubmission : isFirstSubmission,
      packageTitle: updatedFields.hasOwnProperty('packageTitle') ? updatedFields.packageTitle : packageTitle,
      purposeContext: updatedFields.hasOwnProperty('purposeContext') ? updatedFields.purposeContext : purposeContext,
      startDate: updatedFields.hasOwnProperty('startDate') ? updatedFields.startDate : startDate,
      targetDesignDate: updatedFields.hasOwnProperty('targetDesignDate') ? updatedFields.targetDesignDate : targetDesignDate,
      targetReviewDate: updatedFields.hasOwnProperty('targetReviewDate') ? updatedFields.targetReviewDate : targetReviewDate,
      supportingDocs: updatedFields.hasOwnProperty('supportingDocs') ? updatedFields.supportingDocs : supportingDocs,
      uploadedInputs: updatedFields.hasOwnProperty('uploadedInputs') ? updatedFields.uploadedInputs : uploadedInputs,
      drafts: updatedFields.hasOwnProperty('drafts') ? updatedFields.drafts : drafts,
      isDraftNotified: updatedFields.hasOwnProperty('isDraftNotified') ? updatedFields.isDraftNotified : isDraftNotified,
      comments: updatedFields.hasOwnProperty('comments') ? updatedFields.comments : comments,
      formalSubmissions: updatedFields.hasOwnProperty('formalSubmissions') ? updatedFields.formalSubmissions : formalSubmissions,
      consultantFeedbacks: updatedFields.hasOwnProperty('consultantFeedbacks') ? updatedFields.consultantFeedbacks : consultantFeedbacks,
      statutorySubmissions: updatedFields.hasOwnProperty('statutorySubmissions') ? updatedFields.statutorySubmissions : statutorySubmissions,
      authorityComments: updatedFields.hasOwnProperty('authorityComments') ? updatedFields.authorityComments : authorityComments,
      finalResponses: updatedFields.hasOwnProperty('finalResponses') ? updatedFields.finalResponses : finalResponses,
      approvals: updatedFields.hasOwnProperty('approvals') ? updatedFields.approvals : approvals,
      costTrackings: updatedFields.hasOwnProperty('costTrackings') ? updatedFields.costTrackings : costTrackings,

      // Step 2 properties with dynamic fallbacks to ensure sheet writing always has content
      kpPD: updatedFields.hasOwnProperty('kpPD') ? updatedFields.kpPD : (kpPD || (isTarget ? 'Lau Shing Chi (Crimson)' : '')),
      kpEIC: updatedFields.hasOwnProperty('kpEIC') ? updatedFields.kpEIC : (kpEIC || (isTarget ? 'Wai Hon Man' : '')),
      kpPIC: updatedFields.hasOwnProperty('kpPIC') ? updatedFields.kpPIC : (kpPIC || (isTarget ? 'Wong Lok Kwan (Lok)' : '')),
      kpSafety: updatedFields.hasOwnProperty('kpSafety') ? updatedFields.kpSafety : (kpSafety || (isTarget ? 'So Ming Lok (Edvard)' : '')),
      kpSiteRep: updatedFields.hasOwnProperty('kpSiteRep') ? updatedFields.kpSiteRep : (kpSiteRep || (isTarget ? 'Chiu Kin Wing' : '')),
      kpQA: updatedFields.hasOwnProperty('kpQA') ? updatedFields.kpQA : (kpQA || (isTarget ? 'Chan Yuet Man (Moon)、Ng Yui Yau (Oceanna)' : '')),
      kpDesign: updatedFields.hasOwnProperty('kpDesign') ? updatedFields.kpDesign : (kpDesign || (isTarget ? 'Chan Wai Lok (Mars)' : '')),
      kpSec: updatedFields.hasOwnProperty('kpSec') ? updatedFields.kpSec : (kpSec || (isTarget ? 'Tam Kit Yi (Kit)' : '')),
      kpPQS: updatedFields.hasOwnProperty('kpPQS') ? updatedFields.kpPQS : (kpPQS || (isTarget ? 'Cheung Yee Man (Tobey)' : '')),
      kpPlantRep: updatedFields.hasOwnProperty('kpPlantRep') ? updatedFields.kpPlantRep : kpPlantRep,
      kpProcurement: updatedFields.hasOwnProperty('kpProcurement') ? updatedFields.kpProcurement : (kpProcurement || (isTarget ? 'Lun Yik Wun (Rachel)' : '')),
      kpElectrician: updatedFields.hasOwnProperty('kpElectrician') ? updatedFields.kpElectrician : kpElectrician,
      kpSupervisorEngineer: updatedFields.hasOwnProperty('kpSupervisorEngineer') ? updatedFields.kpSupervisorEngineer : kpSupervisorEngineer,
      kpAdminStaff: updatedFields.hasOwnProperty('kpAdminStaff') ? updatedFields.kpAdminStaff : kpAdminStaff,
      kpOthersStaff: updatedFields.hasOwnProperty('kpOthersStaff') ? updatedFields.kpOthersStaff : kpOthersStaff,
    };

    // 隨時更新本地 localStorage 緩存
    try {
      localStorage.setItem(localKey, JSON.stringify(fullState));
    } catch (e) {
      console.warn('localStorage storage limit exceeded. Saving without base64 attachments.', e);
      // 緩存超出限額時，移除大檔案的 base64 內容以保存一般輸入
      const strippedDocs = fullState.supportingDocs.map(doc => ({
        name: doc.name,
        url: doc.url.startsWith('data:') ? '#' : doc.url
      }));
      const strippedState = { ...fullState, supportingDocs: strippedDocs };
      try {
        localStorage.setItem(localKey, JSON.stringify(strippedState));
      } catch (innerErr) {
        console.error('Failed to write to localStorage:', innerErr);
      }
    }

    if (!apiUrl || apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
      console.warn('API URL is not configured. Saved to localStorage.');
      setIsSaving(false);
      return;
    }

    try {
      await postToGAS(apiUrl, {
        action: 'saveState',
        projectId,
        packageId,
        submissionId,
        stateData: fullState
      });
      console.log('State successfully saved to Google Sheets.');
    } catch (err) {
      console.error('Failed to save state to Google Sheets:', err);
      const errMsg = err.response?.data?.message || err.message;
      alert('儲存至雲端失敗（錯誤原因：' + errMsg + '），已為你保存至本地瀏覽器中。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep4FileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingInput(true);
    const startTime = Date.now();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Content = event.target.result.split(',')[1];
      const apiUrl = import.meta.env.VITE_GAS_API_URL;

      let fileUrl = '#';

      if (!apiUrl || apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        const fileId = `input_file_${projectId}_${packageId}_${submissionId}_${Date.now()}_${file.name}`;
        const saved = await saveFileToIndexedDB(fileId, base64Content, file.type);
        fileUrl = saved ? `indexeddb://${fileId}` : event.target.result;
      } else {
        try {
          const res = await postToGAS(apiUrl, {
            type: 'upload',
            fileName: file.name,
            mimeType: file.type,
            fileBase64: base64Content,
            projectId,
            packageId,
            submissionId
          });
          if (res.data && res.data.status === 'success' && res.data.fileUrl) {
            fileUrl = res.data.fileUrl;
          } else {
            throw new Error(res.data.message || 'Upload failed');
          }
        } catch (err) {
          console.error('File upload to Google Drive failed:', err);
          const errMsg = err.response?.data?.message || err.message;
          alert(`上傳至雲端失敗（${errMsg}），已降級保存至本地瀏覽器。`);
          const fileId = `input_file_${projectId}_${packageId}_${submissionId}_${Date.now()}_${file.name}`;
          const saved = await saveFileToIndexedDB(fileId, base64Content, file.type);
          fileUrl = saved ? `indexeddb://${fileId}` : event.target.result;
        }
      }

      const newRecord = {
        id: Date.now(),
        filename: file.name,
        providerType: inputProvider,
        providerName: getProviderName(inputProvider),
        receiveDate: inputReceiveDate,
        url: fileUrl
      };
      const updated = [newRecord, ...uploadedInputs];
      setUploadedInputs(updated);
      syncWithDatabase({ uploadedInputs: updated });

      const elapsed = Date.now() - startTime;
      setTimeout(() => setIsUploadingInput(false), Math.max(0, 1000 - elapsed));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadInput = async (doc) => {
    if (!doc.url || doc.url === '#') {
      alert('此文件沒有可用的下載連結。');
      return;
    }
    if (doc.url.startsWith('indexeddb://')) {
      const fileId = doc.url.replace('indexeddb://', '');
      const fileRecord = await getFileFromIndexedDB(fileId);
      if (fileRecord) {
        const byteCharacters = atob(fileRecord.base64Content);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([byteArray], { type: fileRecord.mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = doc.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        alert('找不到本地檔案記錄。');
      }
    } else if (doc.url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const driveIdMatch = doc.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const apiUrl = import.meta.env.VITE_GAS_API_URL;
      if (driveIdMatch && apiUrl && !apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        try {
          const res = await axios.get(apiUrl, { params: { action: 'getFile', fileId: driveIdMatch[1] } });
          if (res.data && res.data.status === 'success') {
            const { base64Content, mimeType, fileName } = res.data;
            const byteCharacters = atob(base64Content);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName || doc.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch file from GAS:', err);
        }
      }
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteInput = (id) => {
    const updated = uploadedInputs.filter(f => f.id !== id);
    setUploadedInputs(updated);
    syncWithDatabase({ uploadedInputs: updated });
  };

  const handleStep3FileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingFile(true);
    const startTime = Date.now();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Content = event.target.result.split(',')[1];
      const apiUrl = import.meta.env.VITE_GAS_API_URL;
      
      let fileUrl = '#';
      
      if (!apiUrl || apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        console.warn('API URL is not configured. Saving file to local IndexedDB.');
        const fileId = `local_file_${projectId}_${packageId}_${submissionId}_${Date.now()}_${file.name}`;
        const saved = await saveFileToIndexedDB(fileId, base64Content, file.type);
        fileUrl = saved ? `indexeddb://${fileId}` : event.target.result;
      } else {
        try {
          const res = await postToGAS(apiUrl, {
            type: 'upload',
            fileName: file.name,
            mimeType: file.type,
            fileBase64: base64Content,
            projectId,
            packageId,
            submissionId
          });
          if (res.data && res.data.status === 'success' && res.data.fileUrl) {
            fileUrl = res.data.fileUrl;
          } else {
            throw new Error(res.data.message || 'Google Drive upload returned error status.');
          }
        } catch (err) {
          console.error('File upload to Google Drive failed:', err);
          const errMsg = err.response?.data?.message || err.message;
          alert(`上傳至雲端失敗（錯誤原因：${errMsg}），已為你降級保存至本地瀏覽器中。`);
          const fileId = `local_file_${projectId}_${packageId}_${submissionId}_${Date.now()}_${file.name}`;
          const saved = await saveFileToIndexedDB(fileId, base64Content, file.type);
          fileUrl = saved ? `indexeddb://${fileId}` : event.target.result;
        }
      }

      const updatedDocs = [...supportingDocs, { name: file.name, url: fileUrl }];
      setSupportingDocs(updatedDocs);
      syncWithDatabase({ supportingDocs: updatedDocs });

      // 確保至少有 1000 毫秒的加載等待，提升 UI 反饋質感
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 1000 - elapsed);
      setTimeout(() => {
        setIsUploadingFile(false);
      }, delay);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (index) => {
    const updatedDocs = supportingDocs.filter((_, idx) => idx !== index);
    setSupportingDocs(updatedDocs);
    syncWithDatabase({ supportingDocs: updatedDocs });
  };

  const handleDownloadDoc = async (doc) => {
    if (!doc.url) return;
    
    if (doc.url.startsWith('indexeddb://')) {
      const fileId = doc.url.replace('indexeddb://', '');
      const fileRecord = await getFileFromIndexedDB(fileId);
      if (fileRecord) {
        try {
          const byteCharacters = atob(fileRecord.base64Content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileRecord.mimeType });
          const blobUrl = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = doc.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error('Failed to parse and download IndexedDB file:', err);
          alert('無法下載本地檔案：數據可能已損毀。');
        }
      } else {
        alert('找不到此本地檔案的儲存記錄。');
      }
    } else if (doc.url.startsWith('data:')) {
      try {
        const a = document.createElement('a');
        a.href = doc.url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error('Failed to download data url:', err);
        alert('點擊下載失敗，建議部署並配置 Google Apps Script 後端使用雲端儲存。');
      }
    } else if (doc.url === '#') {
      alert('該文件只保留了檔名，其內容因為先前本地容量不足已被移除。請部署並配置 Google Apps Script 後端以使用雲端儲存。');
    } else {
      // 雲端 Google Drive URL：從 GAS 取回 base64 再以 Blob 開啟
      const driveIdMatch = doc.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const apiUrl = import.meta.env.VITE_GAS_API_URL;
      if (driveIdMatch && apiUrl && !apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        const fileId = driveIdMatch[1];
        try {
          const res = await axios.get(apiUrl, { params: { action: 'getFile', fileId } });
          if (res.data && res.data.status === 'success') {
            const { base64Content, mimeType, fileName } = res.data;
            const byteCharacters = atob(base64Content);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName || doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          } else {
            throw new Error(res.data?.message || 'getFile failed');
          }
        } catch (err) {
          console.error('Failed to fetch file from GAS:', err);
          // 降級：直接開新分頁
          window.open(doc.url, '_blank', 'noopener,noreferrer');
        }
      } else {
        window.open(doc.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleUploadDraft = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const nextVersion = `D${drafts.length}`;
    const now = new Date();
    const timeString = now.toLocaleString('zh-HK', { hour12: false });
    const apiUrl = import.meta.env.VITE_GAS_API_URL;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Content = event.target.result.split(',')[1];
      let fileUrl = '#';

      if (!apiUrl || apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        const fileId = `draft_file_${projectId}_${packageId}_${submissionId}_${Date.now()}_${file.name}`;
        const saved = await saveFileToIndexedDB(fileId, base64Content, file.type);
        fileUrl = saved ? `indexeddb://${fileId}` : event.target.result;
      } else {
        try {
          const res = await postToGAS(apiUrl, {
            type: 'upload',
            fileName: file.name,
            mimeType: file.type,
            fileBase64: base64Content,
            projectId,
            packageId,
            submissionId
          });
          if (res.data && res.data.status === 'success' && res.data.fileUrl) {
            fileUrl = res.data.fileUrl;
          } else {
            throw new Error(res.data?.message || 'Upload failed');
          }
        } catch (err) {
          console.error('Draft upload failed:', err);
          alert(`上傳至雲端失敗，已降級保存至本地瀏覽器。`);
          const fileId = `draft_file_${projectId}_${packageId}_${submissionId}_${Date.now()}_${file.name}`;
          const saved = await saveFileToIndexedDB(fileId, base64Content, file.type);
          fileUrl = saved ? `indexeddb://${fileId}` : event.target.result;
        }
      }

      const updatedDrafts = [{
        id: Date.now(),
        version: nextVersion,
        uploadTime: timeString,
        filename: file.name,
        url: fileUrl,
      }, ...drafts];
      setDrafts(updatedDrafts);
      setIsDraftNotified(false);
      syncWithDatabase({ drafts: updatedDrafts, isDraftNotified: false });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadDraft = async (draft) => {
    if (!draft.url || draft.url === '#') {
      alert('此草稿沒有可用的下載連結。');
      return;
    }
    if (draft.url.startsWith('indexeddb://')) {
      const fileId = draft.url.replace('indexeddb://', '');
      const fileRecord = await getFileFromIndexedDB(fileId);
      if (fileRecord) {
        const byteCharacters = atob(fileRecord.base64Content);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([byteArray], { type: fileRecord.mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = draft.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        alert('找不到本地檔案記錄。');
      }
    } else if (draft.url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = draft.url;
      a.download = draft.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const driveIdMatch = draft.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const apiUrl = import.meta.env.VITE_GAS_API_URL;
      if (driveIdMatch && apiUrl && !apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        try {
          const res = await axios.get(apiUrl, { params: { action: 'getFile', fileId: driveIdMatch[1] } });
          if (res.data && res.data.status === 'success') {
            const { base64Content, mimeType, fileName } = res.data;
            const byteCharacters = atob(base64Content);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName || draft.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch draft from GAS:', err);
        }
      }
      window.open(draft.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    syncWithDatabase({ drafts: updated });
  };

  const getProviderName = (type) => {
    switch(type) {
      case 'Client': return details.client || 'N/A';
      case 'Consultant': return details.consultant || 'N/A';
      case 'Main Contractor': return details.mainContractor || 'N/A';
      case 'Site Team': return 'Internal Site Team';
      default: return '';
    }
  };

  useEffect(() => {
    if (currentStep === 3 && submissionDate) {
      const monthsToAdd = isFirstSubmission ? 2 : 1;
      
      const d = new Date(submissionDate);
      d.setMonth(d.getMonth() + monthsToAdd);
      setApprovalDate(d.toISOString().split('T')[0]);
    }
  }, [submissionDate, currentStep, isFirstSubmission]);

  const renderStepContent = () => {
    const stepInfo = steps.find(s => s.id === currentStep);

    if (isLoading) {
      return (
        <Card title="Loading Data">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
            <p className="text-sm text-slate-500 font-medium">Loading database records...</p>
          </div>
        </Card>
      );
    }

    const renderRestrictedArea = (title) => (
      <Card title={title}>
        <div className="flex items-center justify-between bg-red-50 p-5 rounded-lg border border-red-100 mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-4 rounded-full text-red-500 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Access Restricted</h4>
              <p className="text-sm text-slate-500 mt-1">Role <strong className="text-brand">{currentRole}</strong> does not have permission to view or manage this step.</p>
            </div>
          </div>
        </div>
      </Card>
    );

    switch(currentStep) {
      case 1:
        return (
          <Card title="Project Information (Initiation)">
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-3">
                {/* Row 1: Basic Identifiers */}
                <Input label="Project No." defaultValue={project.id} />
                <Input label="Project Name(Short)" defaultValue={project.name} />
                <Input label="Project Name(Chinese)" defaultValue={details.projectNameChinese} />

                {/* Row 2: Dates & Location Details */}
                <Input label="Commencement Date" type="date" defaultValue={details.commencementDate} />
                <Input label="Completion Date" type="date" defaultValue={details.completionDate} />
                <Input label="District" defaultValue={details.district} />

                {/* Row 3: Company Information */}
                <Input label="Company Name(English)" defaultValue={details.companyNameEnglish} />
                <Input label="Company Name(Chinese)" defaultValue={details.companyNameChinese} />
                <Input label="Company Code" defaultValue={details.companyCode} />

                {/* Row 4: Full Project Description */}
                <Input label="Project Name (Full Description)" defaultValue={details.description} type="textarea" colSpan={3} />
                
                {/* Row 5: Address and Map */}
                <div className="col-span-1 lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-3">
                  <Input label="Address" defaultValue={details.address} colSpan={2} />
                  <div className="col-span-1 mb-4 flex flex-col justify-start">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Google Map Link</label>
                    <div className="flex items-center space-x-2 bg-slate-50/50 border border-slate-300 px-3 py-2 rounded-md h-[38px]">
                      <LinkIcon className="w-4 h-4 text-brand flex-shrink-0" />
                      <a href={details.googleMapLink} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline truncate block">
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                </div>

                {/* Row 6: Stakeholders */}
                <Input label="Client" defaultValue={details.client} />
                <Input label="Main Contractor" defaultValue={details.mainContractor} />
                <Input label="Consultant" defaultValue={details.consultant} />
                
                {/* Row 7: Scope */}
                <Input label="Scope of works" defaultValue={details.scopeOfWorks} colSpan={3} />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3 border-t pt-6">
              <Button variant="secondary">Cancel</Button>
              <Button icon={Save} variant="primary" onClick={() => { syncWithDatabase(); alert('Profile saved successfully!'); }}>Generate & Save Profile</Button>
            </div>
          </Card>
        );
      case 2:
        return (
          <Card title="Key Person">
            <p className="text-sm text-slate-500 mb-6">Assign responsibilities for the project scopes.</p>
            
            {/* Related Person in Charge */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-700 bg-blue-50/80 px-5 py-2.5 border-b border-blue-100 rounded-t-lg">Related Person in Charge</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-5 border border-t-0 border-slate-200 rounded-b-lg bg-white">
                <Input label="PD" value={kpPD || (isTarget ? 'Lau Shing Chi (Crimson)' : '')} onChange={(e) => setKpPD(e.target.value)} />
                <Input label="EIC" value={kpEIC || (isTarget ? 'Wai Hon Man' : '')} onChange={(e) => setKpEIC(e.target.value)} />
                <Input label="PIC" value={kpPIC || (isTarget ? 'Wong Lok Kwan (Lok)' : '')} onChange={(e) => setKpPIC(e.target.value)} />
                <Input label="Safety" value={kpSafety || (isTarget ? 'So Ming Lok (Edvard)' : '')} onChange={(e) => setKpSafety(e.target.value)} />
                <Input label="Site Representative" value={kpSiteRep || (isTarget ? 'Chiu Kin Wing' : '')} onChange={(e) => setKpSiteRep(e.target.value)} />
                <Input label="QA" value={kpQA || (isTarget ? 'Chan Yuet Man (Moon)、Ng Yui Yau (Oceanna)' : '')} onChange={(e) => setKpQA(e.target.value)} />
                <Input label="Design" value={kpDesign || (isTarget ? 'Chan Wai Lok (Mars)' : '')} onChange={(e) => setKpDesign(e.target.value)} />
                <Input label="Project Secretary" value={kpSec || (isTarget ? 'Tam Kit Yi (Kit)' : '')} onChange={(e) => setKpSec(e.target.value)} />
                <Input label="PQS" value={kpPQS || (isTarget ? 'Cheung Yee Man (Tobey)' : '')} onChange={(e) => setKpPQS(e.target.value)} />
                <Input label="Plant Representative" value={kpPlantRep || ''} onChange={(e) => setKpPlantRep(e.target.value)} />
                <Input label="Procurement" value={kpProcurement || (isTarget ? 'Lun Yik Wun (Rachel)' : '')} onChange={(e) => setKpProcurement(e.target.value)} />
                <Input label="Electrician" value={kpElectrician || ''} onChange={(e) => setKpElectrician(e.target.value)} />
              </div>
            </div>

            {/* Site Team */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-700 bg-blue-50/80 px-5 py-2.5 border-b border-blue-100 rounded-t-lg">Site Team</h4>
              <div className="grid grid-cols-1 gap-y-1 p-5 border border-t-0 border-slate-200 rounded-b-lg bg-white">
                <Input label="Supervisor and Engineer" type="textarea" value={kpSupervisorEngineer} onChange={(e) => setKpSupervisorEngineer(e.target.value)} />
                <Input label="Administration Staff" type="textarea" value={kpAdminStaff} onChange={(e) => setKpAdminStaff(e.target.value)} />
                <Input label="Others Staff" type="textarea" value={kpOthersStaff} onChange={(e) => setKpOthersStaff(e.target.value)} />
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t pt-6">
              <Button icon={Save} variant="primary" onClick={() => { syncWithDatabase(); alert('Saved successfully!'); }}>Save Key Person</Button>
            </div>
          </Card>
        );
      case 3:
        return (
          <Card title="Submission Schedule (Package Details)">
            <p className="text-sm text-slate-500 mb-6">Define the package scope, key milestone dates, and reminder rules.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Basic Info & Context */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <Input label="Package Title" value={packageTitle} onChange={(e) => setPackageTitle(e.target.value)} />
                  <Input label="Purpose & Context" type="textarea" value={purposeContext} onChange={(e) => setPurposeContext(e.target.value)} />
                  
                  {/* File Upload Area */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supporting Documents</label>
                    <input 
                      type="file" 
                      id="step3-file-input" 
                      className="hidden" 
                      onChange={handleStep3FileUpload} 
                    />
                    <div 
                      onClick={() => !isUploadingFile && document.getElementById('step3-file-input').click()}
                      className={clsx(
                        "border-2 border-dashed border-slate-300 bg-white rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group",
                        isUploadingFile && "opacity-55 cursor-not-allowed"
                      )}
                    >
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-brand mx-auto mb-2 transition-colors" />
                      <p className="text-sm text-slate-600">
                        {isUploadingFile ? "Uploading file..." : "Drag & drop files or click to browse"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Upload context docs, BD/ASD guidelines</p>
                    </div>

                    {/* Uploaded Documents List */}
                    {supportingDocs && supportingDocs.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded Documents</label>
                        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 shadow-sm">
                          {supportingDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 text-sm">
                              <button 
                                onClick={() => handleDownloadDoc(doc)}
                                className="text-brand font-medium hover:underline flex items-center text-left truncate max-w-[240px]"
                              >
                                <FileText className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{doc.name}</span>
                              </button>
                              <button 
                                onClick={() => handleRemoveDoc(idx)} 
                                className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors ml-2"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Notification Rules</h4>
                  <label className="flex items-start space-x-3 text-sm text-slate-700">
                    <input type="checkbox" defaultChecked className="mt-1 rounded text-brand focus:ring-brand" />
                    <span>
                      <strong className="block text-slate-800">3-Day Advance Notification</strong>
                      <span className="block mt-0.5 text-slate-500 text-xs leading-relaxed">Notify relevant persons (mainly Design In-charge) 3 days before each critical date.</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Right Column: Key Milestone Dates */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-200">Critical Milestone Dates</h4>
                <div className="space-y-4">
                  <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <Input label="Target Design Completion Date" type="date" value={targetDesignDate} onChange={(e) => setTargetDesignDate(e.target.value)} />
                  <Input label="Target Review & Reply Completion Date" type="date" value={targetReviewDate} onChange={(e) => setTargetReviewDate(e.target.value)} />
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Submission Date (to BD/ASD)</label>
                      <input 
                        type="date" 
                        value={submissionDate}
                        onChange={(e) => setSubmissionDate(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800"
                      />
                    </div>
                    
                    <div className="mb-4 relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Target Approval Date
                        </label>
                        <label className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 transition-colors border border-slate-200">
                          <input 
                            type="checkbox" 
                            checked={isFirstSubmission}
                            onChange={(e) => setIsFirstSubmission(e.target.checked)}
                            className="rounded text-brand focus:ring-brand w-3 h-3" 
                          />
                          <span>First Submission (2 Months)</span>
                        </label>
                      </div>
                      <input 
                        type="date" 
                        value={approvalDate}
                        onChange={(e) => setApprovalDate(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t pt-6">
              <Button icon={Save} variant="primary" onClick={() => { syncWithDatabase(); alert('Saved successfully!'); }}>Save Package Schedule</Button>
            </div>
          </Card>
        );
      case 4:
        return (
          <Card title="Design Input Information">
            {currentRole === 'Design' ? (
              <div className="space-y-6">
                {/* Upload Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">Register New Design Input</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Information Provider</label>
                      <select 
                        value={inputProvider}
                        onChange={(e) => setInputProvider(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800"
                      >
                        <option value="Client">Client</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Main Contractor">Main Contractor</option>
                        <option value="Site Team">Site Team</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Provider Details (From Step 1)</label>
                      <div className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-slate-100 text-slate-600 truncate cursor-not-allowed">
                        {getProviderName(inputProvider)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date Received by Design Dept.</label>
                      <input 
                        type="date" 
                        value={inputReceiveDate}
                        onChange={(e) => setInputReceiveDate(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800"
                      />
                    </div>
                  </div>
                  
                  <input
                    id="step4-file-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.dwg,.rvt,.png,.jpg,.jpeg,.xlsx,.docx"
                    onChange={handleStep4FileUpload}
                    disabled={isUploadingInput}
                  />
                  <div
                    onClick={() => !isUploadingInput && document.getElementById('step4-file-input').click()}
                    className={clsx(
                      "border-2 border-dashed border-brand/30 bg-white rounded-lg p-6 text-center transition-colors group mt-2",
                      isUploadingInput ? "opacity-60 cursor-not-allowed" : "hover:bg-brand/5 cursor-pointer"
                    )}
                  >
                    <UploadCloud className="w-8 h-8 text-brand mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <p className="text-sm text-slate-600 font-medium">
                      {isUploadingInput ? 'Uploading file...' : 'Click to Browse or Drag & Drop Input Files'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DWG, RVT, Images up to 500MB</p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button icon={Save} variant="primary" onClick={() => { syncWithDatabase(); }}>Save Design Input</Button>
                  </div>
                </div>

                {/* Registered Inputs Table */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Registered Inputs</h4>
                  {uploadedInputs.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200 text-slate-400 text-sm">
                      No input files registered yet.
                    </div>
                  ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">File Name</th>
                          <th className="px-4 py-3">Provider Role</th>
                          <th className="px-4 py-3">Provider Name</th>
                          <th className="px-4 py-3">Date Received</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {uploadedInputs.map(file => (
                          <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDownloadInput(file)}
                                className="font-medium text-brand hover:underline flex items-center text-left"
                              >
                                <FileText className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                                {file.filename}
                              </button>
                            </td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{file.providerType}</span></td>
                            <td className="px-4 py-3">{file.providerName}</td>
                            <td className="px-4 py-3">{file.receiveDate}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteInput(file.id)}
                                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-slate-700 font-medium text-lg">Permission Denied</h4>
                <p className="text-sm text-slate-500 mt-1">Only the <strong className="text-brand">Design</strong> role can register design input information.</p>
              </div>
            )}
          </Card>
        );
      case 5:
        const currentDraftVersion = `D${drafts.length}`;
        const currentTargetDraft = drafts.length > 0 ? drafts[0].version : 'D0';
        const effectiveTargetDraft = commentTargetDraft || currentTargetDraft;

        const handleAddComment = () => {
          if (!newCommentText.trim()) return;
          const newComment = {
            id: `COM-00${comments.length + 1}`,
            authorRole: currentRole,
            time: 'Just now',
            severity: 'Normal',
            content: newCommentText,
            targetDraft: effectiveTargetDraft,
            reply: null,
            hasImage: true
          };
          const updated = [newComment, ...comments];
          setComments(updated);
          setNewCommentText('');
          setShowCommentForm(false);
          syncWithDatabase({ comments: updated });
        };

        const handleReply = (id) => {
          if (!replyText.trim() && !replyImage) return;
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const updated = comments.map(c =>
            c.id === id ? { ...c, reply: { authorRole: currentRole, text: replyText, image: replyImage, time: timeStr } } : c
          );
          setComments(updated);
          setReplyTextId(null);
          setReplyText('');
          setReplyImage(null);
          syncWithDatabase({ comments: updated });
        };

        return (
          <Card title="Draft & Internal Review">
            {/* Tab switcher */}
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
              <button onClick={() => setStep5Tab('draft')} className={clsx('px-4 py-1.5 rounded-md text-sm font-semibold transition-all', step5Tab === 'draft' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Draft Issuance</button>
              <button onClick={() => setStep5Tab('review')} className={clsx('px-4 py-1.5 rounded-md text-sm font-semibold transition-all', step5Tab === 'review' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Internal Review</button>
            </div>

            {step5Tab === 'draft' && <>
            <p className="text-sm text-slate-500 mb-6">Upload the design draft for internal review by QS, Site Team, Tender, and Procurement.</p>

            {/* Upload Area */}
            {currentRole === 'Design' ? (
              <>
                <input
                  id="step5-file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.dwg,.rvt,.png,.jpg,.jpeg"
                  onChange={handleUploadDraft}
                />
                <div
                  onClick={() => document.getElementById('step5-file-input').click()}
                  className="border-2 border-dashed border-brand/30 bg-white rounded-xl p-10 text-center hover:bg-brand/5 transition-colors cursor-pointer group mb-8"
                >
                  <UploadCloud className="w-10 h-10 text-brand mx-auto mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-lg font-bold text-slate-800">Drag & Drop Draft Document Here</h4>
                  <p className="text-sm text-slate-500 mt-2">Next Revision: <span className="font-bold text-brand bg-brand/10 px-2 py-0.5 rounded ml-1">{currentDraftVersion}</span></p>
                  <p className="text-xs text-slate-400 mt-1">Supports PDF, DWG up to 500MB</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-4 rounded-full text-brand shadow-inner">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg flex items-center">
                      Next Revision: <span className="ml-2 bg-brand text-white px-2 py-0.5 rounded text-sm">{currentDraftVersion}</span>
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">Pending upload by Design In-charge</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400 italic">Only Design role can upload</div>
              </div>
            )}

            {/* Draft History Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Draft Issuance History</h4>
              {drafts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200 text-slate-400 text-sm">
                  No drafts uploaded yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4">Version</th>
                        <th className="px-5 py-4">File Name</th>
                        <th className="px-5 py-4">Upload Time</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {drafts.map((draft, idx) => (
                        <tr key={draft.id} className={idx === 0 ? "bg-blue-50/30" : "hover:bg-slate-50"}>
                          <td className="px-5 py-4 font-bold text-slate-800">{draft.version}</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleDownloadDraft(draft)}
                              className="font-medium text-brand hover:underline flex items-center text-left"
                            >
                              <FileText className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                              {draft.filename}
                            </button>
                          </td>
                          <td className="px-5 py-4">{draft.uploadTime}</td>
                          <td className="px-5 py-4">
                            {idx === 0 && isDraftNotified ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold tracking-wide">In Review</span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold tracking-wide">Uploaded</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {idx === 0 && currentRole === 'Design' && !isDraftNotified ? (
                                <button
                                  onClick={() => { setIsDraftNotified(true); syncWithDatabase({ isDraftNotified: true }); }}
                                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-all"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Notify Reviewers
                                </button>
                              ) : idx === 0 && isDraftNotified ? (
                                <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                                  <CheckCircle className="w-4 h-4 mr-1.5" /> Notified
                                </span>
                              ) : null}
                              {currentRole === 'Design' && (
                                <button
                                  onClick={() => handleDeleteDraft(draft.id)}
                                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </>}

            {step5Tab === 'review' && <>
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Cross-department comments and responses.</p>
                <p className="text-xs text-slate-400">Current Target Draft: <span className="font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">{currentTargetDraft}</span></p>
              </div>
              
              {currentRole !== 'Design' && (
                <button 
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-sm font-semibold transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> 
                  {showCommentForm ? 'Cancel' : 'Leave Comment'}
                </button>
              )}
            </div>

            {/* Comment Form for Non-Design Roles */}
            {showCommentForm && currentRole !== 'Design' && (
              <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-slate-700">Add New Comment</h4>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Target Draft</label>
                    <select 
                      value={effectiveTargetDraft}
                      onChange={e => setCommentTargetDraft(e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-bold text-brand focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                    >
                      {drafts.length > 0 ? (
                        drafts.map(d => <option key={d.version} value={d.version}>{d.version}</option>)
                      ) : (
                        <option value="D0">D0</option>
                      )}
                    </select>
                  </div>
                </div>
                <textarea 
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Describe your issue or feedback..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white mb-3 min-h-[100px]"
                ></textarea>
                <div className="flex items-center justify-between">
                  <button className="flex items-center text-xs text-slate-500 hover:text-brand font-semibold px-3 py-1.5 border border-slate-200 bg-white rounded transition-colors shadow-sm">
                    <ImageIcon className="w-4 h-4 mr-1.5" /> Upload Image
                  </button>
                  <button 
                    onClick={handleAddComment}
                    className="flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95 bg-brand text-white hover:bg-brand-dark"
                  >
                    <Save className="w-4 h-4 mr-2" /> Submit Comment
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 w-24">ID</th>
                    <th className="px-5 py-4 w-32">Draft / Role</th>
                    <th className="px-5 py-4">Comment Description & Reply</th>
                    <th className="px-5 py-4 text-right w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comments.map(comment => (
                    <tr key={comment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-800 align-top">{comment.id}</td>
                      <td className="px-5 py-4 align-top">
                        <div className="mb-1">
                           <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{comment.targetDraft}</span>
                        </div>
                        <span className="font-semibold block text-brand">{comment.authorRole}</span>
                        <span className="text-[10px] text-slate-400">{comment.time}</span>
                      </td>
                      <td className="px-5 py-4 leading-relaxed align-top">
                        <div className="mb-2">
                          {comment.content}
                          {comment.hasImage && (
                            <div className="mt-2 text-xs font-semibold text-blue-600 flex items-center bg-blue-50 w-max px-2 py-1 rounded border border-blue-100 cursor-pointer">
                              <ImageIcon className="w-3.5 h-3.5 mr-1" /> View Attached Image
                            </div>
                          )}
                        </div>
                        
                        {/* Reply Display */}
                        {comment.reply && (
                          <div className="mt-3 bg-slate-100 p-3 rounded-lg border border-slate-200 relative">
                            <div className="absolute -top-2.5 left-4 bg-slate-100 px-1 text-[10px] font-bold text-slate-500 uppercase">{comment.reply.authorRole} Reply</div>
                            <p className="text-sm text-slate-700 mt-1">{comment.reply.text}</p>
                            {comment.reply.image && (
                              <div className="mt-2 text-xs font-semibold text-brand flex items-center bg-brand/5 w-max px-2 py-1 rounded border border-brand/10 cursor-pointer">
                                <ImageIcon className="w-3.5 h-3.5 mr-1" /> View Attached Image
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-2 text-right">{comment.reply.time}</div>
                          </div>
                        )}

                        {/* Reply Form */}
                        {replyTextId === comment.id && !comment.reply && (
                          <div className="mt-3 bg-white p-3 rounded-lg border border-brand/20 shadow-sm">
                            <textarea 
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white mb-2"
                            ></textarea>
                            <div className="flex justify-between items-center">
                              <button 
                                onClick={() => setReplyImage('Reply_Attachment.png')}
                                className={clsx(
                                  "flex items-center text-[10px] font-bold px-2 py-1 rounded transition-colors",
                                  replyImage ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
                                )}
                              >
                                <ImageIcon className="w-3 h-3 mr-1" /> {replyImage ? "Image Attached" : "Attach Image"}
                              </button>
                              <div className="flex space-x-2">
                                <button onClick={() => { setReplyTextId(null); setReplyImage(null); }} className="text-xs font-semibold px-3 py-1.5 text-slate-500 hover:text-slate-700">Cancel</button>
                                <button onClick={() => handleReply(comment.id)} className="text-xs font-semibold px-3 py-1.5 bg-brand text-white rounded hover:bg-brand-dark transition-all active:scale-95 shadow-sm">Send Reply</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                        {currentRole === 'Design' && !comment.reply && replyTextId !== comment.id ? (
                          <button onClick={() => setReplyTextId(comment.id)} className="text-brand font-semibold hover:underline bg-brand/5 px-3 py-1.5 rounded-md text-xs">Reply</button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>}
          </Card>
        );
      case 6:
        const handleAddConsultantFeedback = () => {
          if (!cfFile) { alert('Please upload a Comment Form/Mark-up File.'); return; }
          if (!cfDescription.trim()) { alert('Please provide a comment description.'); return; }
          const nowCf = new Date();
          const timeStrCf = `${nowCf.toISOString().slice(0, 10)} ${nowCf.getHours().toString().padStart(2, '0')}:${nowCf.getMinutes().toString().padStart(2, '0')}`;
          const newFeedback = { id: `CF-${consultantFeedbacks.length + 1}`, date: cfReceivedDate, file: cfFile, description: cfDescription, uploader: currentRole, uploadTime: timeStrCf, reply: null };
          const updatedCf = [newFeedback, ...consultantFeedbacks];
          setConsultantFeedbacks(updatedCf);
          setCfFile(null);
          setCfDescription('');
          syncWithDatabase({ consultantFeedbacks: updatedCf });
        };

        const handleCfReply = (id) => {
          if (!cfReplyText.trim() && !cfReplyImage) return;
          const nowCfR = new Date();
          const timeStrCfR = `${nowCfR.toISOString().slice(0, 10)} ${nowCfR.getHours().toString().padStart(2, '0')}:${nowCfR.getMinutes().toString().padStart(2, '0')}`;
          const updatedCfR = consultantFeedbacks.map(cf => cf.id === id ? { ...cf, reply: { authorRole: currentRole, text: cfReplyText, image: cfReplyImage, time: timeStrCfR } } : cf);
          setConsultantFeedbacks(updatedCfR);
          setCfReplyId(null); setCfReplyText(''); setCfReplyImage(null);
          syncWithDatabase({ consultantFeedbacks: updatedCfR });
        };

        const handleIssueSubmission = () => {
          if (!formalSubmissionFile) {
            alert('Please upload the Formal Submission Document first.');
            return;
          }
          if (!uploadRef.trim()) {
            alert('Please provide an Upload Reference (File or Link).');
            return;
          }
          if (!transmittalRef.trim()) {
            alert('Please provide a Transmittal Ref No.');
            return;
          }
          
          const newSub = {
            id: formalSubmissions.length + 1,
            round: issueRound,
            ref: transmittalRef,
            date: issueDate.replace('T', ' '),
            method: issueMethod,
            link: uploadRef,
            fileName: formalSubmissionFile
          };
          const updated = [newSub, ...formalSubmissions];
          setFormalSubmissions(updated);
          
          const nextNum = parseInt(issueRound.replace('C', '')) + 1;
          setIssueRound(`C${nextNum}`);
          setUploadRef('');
          setFormalSubmissionFile(null);
          syncWithDatabase({ formalSubmissions: updated });
        };

        return (
          <Card title="Formal Submission & Consultant Feedback">
            {/* Tab switcher */}
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
              <button onClick={() => setStep6Tab('formal')} className={clsx('px-4 py-1.5 rounded-md text-sm font-semibold transition-all', step6Tab === 'formal' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Formal Submission</button>
              <button onClick={() => setStep6Tab('feedback')} className={clsx('px-4 py-1.5 rounded-md text-sm font-semibold transition-all', step6Tab === 'feedback' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Consultant Feedback</button>
            </div>

            {step6Tab === 'formal' && <>
            <p className="text-sm text-slate-500 mb-6">Freeze the draft version and officially issue it to the consultant.</p>

            {currentRole === 'Design' ? (
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
                <h4 className="text-sm font-bold text-slate-700 mb-4">New Formal Issue</h4>
                
                {/* Formal Submission Document Upload Area */}
                <div className="mb-8">
                  <div 
                    onClick={() => setFormalSubmissionFile('Final_Design_Submission.pdf')}
                    className={clsx(
                      "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group",
                      formalSubmissionFile ? "border-emerald-400 bg-emerald-50" : "border-brand/40 bg-white hover:bg-brand/5"
                    )}
                  >
                    {formalSubmissionFile ? (
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    ) : (
                      <UploadCloud className="w-10 h-10 text-brand mx-auto mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                    )}
                    <h4 className="text-lg font-bold text-slate-800 flex items-center justify-center">
                      {formalSubmissionFile ? "Submission Document Ready" : "Drag & Drop Formal Submission Document Here"}
                    </h4>
                    {formalSubmissionFile ? (
                      <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center justify-center">
                        <FileText className="w-4 h-4 mr-1.5" /> {formalSubmissionFile}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 mt-2">This is the finalized design drawing/report to be issued.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Issue Round</label>
                    <input type="text" value={issueRound} onChange={e => setIssueRound(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Transmittal Ref No.</label>
                    <input type="text" value={transmittalRef} onChange={e => setTransmittalRef(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Issue Date/Time</label>
                    <input type="datetime-local" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Issue Method</label>
                    <input type="text" value={issueMethod} onChange={e => setIssueMethod(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Upload Reference (File or Link)</label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div 
                      onClick={() => setUploadRef('Transmittal_Attachment.zip')}
                      className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-brand/50 rounded-lg p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[100px] group"
                    >
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-2 group-hover:text-brand transition-colors" />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-brand transition-colors">Drag & Drop or Click to Upload File</span>
                      <span className="text-xs text-slate-400 mt-1">ZIP, PDF, MSG</span>
                    </div>
                    <div className="flex flex-col justify-center relative">
                      <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-4 bg-white hidden lg:flex items-center justify-center text-[10px] font-bold text-slate-400">OR</div>
                      <div className="text-xs font-bold text-slate-400 text-center mb-2 uppercase tracking-widest lg:hidden">- OR -</div>
                      <input 
                        type="text" 
                        value={uploadRef} 
                        onChange={e => setUploadRef(e.target.value)} 
                        placeholder="Enter URL (e.g. DMS Link, Sharepoint)" 
                        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white shadow-sm" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <Button variant="secondary">Preview Transmittal PDF</Button>
                  <button 
                    onClick={handleIssueSubmission}
                    className="flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95 bg-brand text-white hover:bg-brand-dark"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Confirm & Issue to Consultant
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-blue-50/50 p-5 rounded-lg border border-blue-100 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-4 rounded-full text-brand shadow-inner">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">Formal Issue Restricted</h4>
                    <p className="text-sm text-slate-500 mt-1">Only the <strong className="text-brand">Design</strong> role can issue official submissions to the consultant.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Issued Submissions History */}
            {formalSubmissions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Issued Submission History</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4 w-20">Round</th>
                        <th className="px-5 py-4">Submission Doc</th>
                        <th className="px-5 py-4">Transmittal Ref</th>
                        <th className="px-5 py-4">Issue Date/Time</th>
                        <th className="px-5 py-4">Method / Ref Link</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {formalSubmissions.map((sub, idx) => (
                        <tr key={sub.id} className={idx === 0 ? "bg-emerald-50/30" : "hover:bg-slate-50 transition-colors"}>
                          <td className="px-5 py-4 font-bold text-slate-800">{sub.round}</td>
                          <td className="px-5 py-4">
                            <a href="#" className="flex items-center text-brand font-semibold hover:underline" onClick={(e) => e.preventDefault()}>
                              <FileText className="w-4 h-4 mr-1.5" />
                              <span className="truncate max-w-[150px] inline-block align-bottom">{sub.fileName}</span>
                            </a>
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-700">{sub.ref}</td>
                          <td className="px-5 py-4">{sub.date}</td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800 mb-1">{sub.method}</div>
                            <a href={sub.link} className="text-xs text-blue-600 hover:underline flex items-center" onClick={(e) => e.preventDefault()}>
                              <LinkIcon className="w-3 h-3 mr-1" /> View Upload Reference
                            </a>
                          </td>
                          <td className="px-5 py-4">
                            {idx === 0 ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold tracking-wide">Issued (Active)</span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-bold tracking-wide">Superseded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>}

            {step6Tab === 'feedback' && <>
            <p className="text-sm text-slate-500 mb-6">Track and manage external consultant comments and mark-ups.</p>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">Record New Feedback</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Consultant Comment Received Date</label>
                  <input type="date" value={cfReceivedDate} onChange={e => setCfReceivedDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Comment Form / Mark-up Upload</label>
                  <div 
                    onClick={() => setCfFile('Consultant_Markup_RevA.pdf')}
                    className={clsx(
                      "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[42px]",
                      cfFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <UploadCloud className={clsx("w-5 h-5 mb-1", cfFile ? "text-emerald-500" : "text-slate-400")} />
                    <span className="text-xs font-medium text-slate-600">{cfFile || "Drag & Drop Markup File"}</span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">DESCRIPTION</label>
                <textarea 
                  value={cfDescription}
                  onChange={e => setCfDescription(e.target.value)}
                  placeholder="Enter a brief description of the consultant's feedback..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white min-h-[100px]"
                ></textarea>
              </div>
              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button variant="primary" icon={Save} onClick={handleAddConsultantFeedback}>Save Feedback Record</Button>
              </div>
            </div>

            {consultantFeedbacks.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">CONSULTANT REVIEW RECORD HISTORY</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4 w-24 text-center">ID</th>
                        <th className="px-5 py-4 w-40">Info / File</th>
                        <th className="px-5 py-4">DESCRIPTION & REPLY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {consultantFeedbacks.map((fb) => (
                        <tr key={fb.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-400 text-center align-top">{fb.id}</td>
                          <td className="px-5 py-4 align-top">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Received Date</div>
                            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center"><Calendar className="w-3 h-3 mr-1 text-brand" /> {fb.date}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Attached File</div>
                            <a href="#" className="flex items-center text-brand font-semibold hover:underline text-xs" onClick={(e) => e.preventDefault()}>
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              <span className="truncate max-w-[100px]">{fb.file}</span>
                            </a>
                          </td>
                          <td className="px-5 py-4 leading-relaxed align-top">
                            <div className="mb-2 text-slate-800 font-medium whitespace-pre-wrap">
                              {fb.description}
                            </div>
                            <div className="flex justify-between items-center mb-4">
                              <div className="text-[10px] text-slate-400 font-semibold italic">Uploaded by {fb.uploader} at {fb.uploadTime}</div>
                              {!fb.reply && cfReplyId !== fb.id ? (
                                <button onClick={() => setCfReplyId(fb.id)} className="text-brand font-bold hover:underline bg-brand/5 px-3 py-1 rounded-md text-[10px] transition-all hover:bg-brand/10 uppercase tracking-wider">REPLY</button>
                              ) : fb.reply ? (
                                <div className="bg-emerald-100 text-emerald-700 p-1 rounded-full shadow-sm"><CheckCircle className="w-3.5 h-3.5" /></div>
                              ) : null}
                            </div>
                            
                            {/* Reply Display */}
                            {fb.reply && (
                              <div className="mt-3 bg-slate-100 p-3 rounded-lg border border-slate-200 relative">
                                <div className="absolute -top-2.5 left-4 bg-slate-100 px-1 text-[10px] font-bold text-slate-500 uppercase">{fb.reply.authorRole} Reply</div>
                                <p className="text-sm text-slate-700 mt-1">{fb.reply.text}</p>
                                {fb.reply.image && (
                                  <div className="mt-2 text-xs font-semibold text-brand flex items-center bg-brand/5 w-max px-2 py-1 rounded border border-brand/10 cursor-pointer">
                                    <ImageIcon className="w-3.5 h-3.5 mr-1" /> View Attached Image
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400 mt-2 text-right">{fb.reply.time}</div>
                              </div>
                            )}

                            {/* Reply Form */}
                            {cfReplyId === fb.id && !fb.reply && (
                              <div className="mt-3 bg-white p-3 rounded-lg border border-brand/20 shadow-md">
                                <textarea 
                                  value={cfReplyText}
                                  onChange={e => setCfReplyText(e.target.value)}
                                  placeholder="Type your reply here..."
                                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white mb-2 min-h-[80px]"
                                ></textarea>
                                <div className="flex justify-between items-center">
                                  <button 
                                    onClick={() => setCfReplyImage('Reply_Attachment.png')}
                                    className={clsx(
                                      "flex items-center text-[10px] font-bold px-2 py-1 rounded transition-colors",
                                      cfReplyImage ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
                                    )}
                                  >
                                    <ImageIcon className="w-3 h-3 mr-1" /> {cfReplyImage ? "Image Attached" : "Attach Image"}
                                  </button>
                                  <div className="flex space-x-2">
                                    <button onClick={() => { setCfReplyId(null); setCfReplyImage(null); }} className="text-xs font-semibold px-3 py-1.5 text-slate-500 hover:text-slate-700">Cancel</button>
                                    <button onClick={() => handleCfReply(fb.id)} className="text-xs font-semibold px-3 py-1.5 bg-brand text-white rounded hover:bg-brand-dark shadow-sm transition-all active:scale-95">Send Reply</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>}
          </Card>
        );
      case 7:
        if (currentRole !== 'Design' && currentRole !== 'Site Team') return renderRestrictedArea(stepInfo.title);

        const handleAddStatutorySubmission = () => {
          if (!ssRtcComplete) {
            alert('Please confirm Consultant R to C table is completed.');
            return;
          }
          if (!ssSubmittedDate) {
            alert('Please provide SUBMITTED TO AUTHORITY date.');
            return;
          }
          
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          const dueDate = new Date(ssSubmittedDate);
          dueDate.setMonth(dueDate.getMonth() + (isFirstSubmission ? 2 : 1));

          const newSub = {
            id: statutorySubmissions.length + 1,
            version: ssVersion,
            replyDate: ssReplyDate || 'N/A',
            submittedDate: ssSubmittedDate,
            dueDate: dueDate.toISOString().slice(0, 10),
            drawings: ssDrawingsFile,
            report: ssReportFile,
            notify: ssNotifyDue,
            uploader: currentRole,
            uploadTime: timeStr
          };
          const updated = [newSub, ...statutorySubmissions];
          setStatutorySubmissions(updated);
          setSsDrawingsFile(null);
          setSsReportFile(null);
          setSsRtcComplete(false);
          setSsNotifyDue(false);
          syncWithDatabase({ statutorySubmissions: updated });
        };

        const calculatedDueDateDisplay = () => {
          if (!ssSubmittedDate) return 'N/A';
          const d = new Date(ssSubmittedDate);
          d.setMonth(d.getMonth() + (isFirstSubmission ? 2 : 1));
          return d.toISOString().slice(0, 10);
        };

        return (
          <Card title="Statutory Submission Tracking">
            <p className="text-sm text-slate-500 mb-6">Track and remind the formal statutory submission process and authority feedback loop.</p>
            
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Register Submission Status</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-3 text-sm font-bold text-slate-700 bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                    <input type="checkbox" checked={ssRtcComplete} onChange={e => setSsRtcComplete(e.target.checked)} className="rounded text-brand focus:ring-brand w-4 h-4" />
                    <span>Confirm Consultant R to C Table is Complete</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">REPLY TO CONSULTANT (Date)</label>
                  <input type="date" value={ssReplyDate} onChange={e => setSsReplyDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SUBMITTED TO AUTHORITY (Date)</label>
                  <input type="date" value={ssSubmittedDate} onChange={e => setSsSubmittedDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SUBMISSION DRAWINGS (Upload)</label>
                  <div 
                    onClick={() => setSsDrawingsFile('SUB_Drawings_Set.zip')}
                    className={clsx(
                      "border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[42px]",
                      ssDrawingsFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <UploadCloud className={clsx("w-4 h-4 mb-1", ssDrawingsFile ? "text-emerald-500" : "text-slate-400")} />
                    <span className="text-[10px] font-medium text-slate-600">{ssDrawingsFile || "Drag & Drop Drawings"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SUBMISSION REPORT (Upload)</label>
                  <div 
                    onClick={() => setSsReportFile('SUB_Report_Final.pdf')}
                    className={clsx(
                      "border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[42px]",
                      ssReportFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <UploadCloud className={clsx("w-4 h-4 mb-1", ssReportFile ? "text-emerald-500" : "text-slate-400")} />
                    <span className="text-[10px] font-medium text-slate-600">{ssReportFile || "Drag & Drop Report"}</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4 text-sm font-semibold text-slate-600">
                      <div className="flex items-center px-3 py-1 bg-slate-100 rounded border border-slate-200">
                         <span className="text-slate-400 mr-2 text-[10px] uppercase">Est. Due Date:</span>
                         <span className={clsx("text-brand font-bold", !ssSubmittedDate && "text-slate-300")}>{calculatedDueDateDisplay()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase italic">
                        ({isFirstSubmission ? "2 Months" : "1 Month"} from Submission)
                      </div>
                    </div>
                    <label className="flex items-center space-x-2 text-xs font-bold text-brand bg-brand/5 px-4 py-2 rounded-md border border-brand/20 cursor-pointer hover:bg-brand/10 transition-colors">
                      <input type="checkbox" checked={ssNotifyDue} onChange={e => setSsNotifyDue(e.target.checked)} className="rounded text-brand focus:ring-brand w-3.5 h-3.5" />
                      <span>NOTIFY DESIGN TEAM & SITE TEAM 7 DAYS BEFORE DUE DATE</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Submission Version / Ref</label>
                  <input type="text" value={ssVersion} onChange={e => setSsVersion(e.target.value)} placeholder="e.g. BD-1st-Sub" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button variant="primary" icon={Save} onClick={handleAddStatutorySubmission}>Record Submission Status</Button>
              </div>
            </div>



            {statutorySubmissions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Statutory Submission Log</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4">Version</th>
                        <th className="px-5 py-4">Submitted Date</th>
                        <th className="px-5 py-4">Est. Due Date</th>
                        <th className="px-5 py-4">Files</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {statutorySubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-800 align-top">{sub.version}</td>
                          <td className="px-5 py-4 align-top">
                            <div className="font-semibold">{sub.submittedDate}</div>
                            <div className="text-[10px] text-slate-400 mt-1">Reply: {sub.replyDate}</div>
                          </td>
                          <td className="px-5 py-4 align-top font-bold text-brand">{sub.dueDate}</td>
                          <td className="px-5 py-4 align-top">
                             <div className="flex flex-col space-y-1">
                                {sub.drawings && <div className="text-[10px] flex items-center text-slate-600"><FileText className="w-3 h-3 mr-1" /> Drawings</div>}
                                {sub.report && <div className="text-[10px] flex items-center text-slate-600"><FileText className="w-3 h-3 mr-1" /> Report</div>}
                             </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600 w-max">{sub.uploader}</span>
                              {sub.notify && <span className="text-[9px] font-bold text-brand mt-1 uppercase flex items-center"><Bell className="w-2.5 h-2.5 mr-0.5" /> Notify Active</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      case 8:
        if (currentRole !== 'Design' && currentRole !== 'Site Team') return renderRestrictedArea(stepInfo.title);

        const handleAddAuthorityComment = () => {
          if (!acFile) {
            alert('Please upload an Authority Comment Form/Mark-up File.');
            return;
          }
          if (!acDescription.trim()) {
            alert('Please provide a comment description.');
            return;
          }
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          const newComment = {
            id: `AC-${authorityComments.length + 1}`,
            date: acReceivedDate,
            file: acFile,
            description: acDescription,
            uploader: currentRole,
            uploadTime: timeStr,
            reply: null
          };
          const updated = [newComment, ...authorityComments];
          setAuthorityComments(updated);
          setAcFile(null);
          setAcDescription('');
          syncWithDatabase({ authorityComments: updated });
        };

        const handleAcReply = (id) => {
          if (!acReplyText.trim() && !acReplyImage) return;
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          const updated = authorityComments.map(ac => 
            ac.id === id ? { ...ac, reply: { authorRole: currentRole, text: acReplyText, image: acReplyImage, time: timeStr } } : ac
          );
          setAuthorityComments(updated);
          setAcReplyId(null);
          setAcReplyText('');
          setAcReplyImage(null);
          syncWithDatabase({ authorityComments: updated });
        };

        return (
          <Card title="Authority Comment Processing">
            <p className="text-sm text-slate-500 mb-6">Track and manage formal authority comments and mark-ups.</p>
            
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">Record New Authority Comment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Authority Comment Received Date</label>
                  <input type="date" value={acReceivedDate} onChange={e => setAcReceivedDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Authority Mark-up Upload</label>
                  <div 
                    onClick={() => setAcFile('Authority_Markup_Rev0.pdf')}
                    className={clsx(
                      "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[42px]",
                      acFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <UploadCloud className={clsx("w-5 h-5 mb-1", acFile ? "text-emerald-500" : "text-slate-400")} />
                    <span className="text-xs font-medium text-slate-600">{acFile || "Drag & Drop Authority File"}</span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">DESCRIPTION</label>
                <textarea 
                  value={acDescription}
                  onChange={e => setAcDescription(e.target.value)}
                  placeholder="Enter a brief description of the authority's feedback..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white min-h-[100px]"
                ></textarea>
              </div>
              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button variant="primary" icon={Save} onClick={handleAddAuthorityComment}>Save Authority Record</Button>
              </div>
            </div>

            {authorityComments.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">AUTHORITY REVIEW RECORD HISTORY</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4 w-24 text-center">ID</th>
                        <th className="px-5 py-4 w-40">Info / File</th>
                        <th className="px-5 py-4">DESCRIPTION & REPLY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {authorityComments.map((ac) => (
                        <tr key={ac.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-400 text-center align-top">{ac.id}</td>
                          <td className="px-5 py-4 align-top">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Received Date</div>
                            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center"><Calendar className="w-3 h-3 mr-1 text-brand" /> {ac.date}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Attached File</div>
                            <a href="#" className="flex items-center text-brand font-semibold hover:underline text-xs" onClick={(e) => e.preventDefault()}>
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              <span className="truncate max-w-[100px]">{ac.file}</span>
                            </a>
                          </td>
                          <td className="px-5 py-4 leading-relaxed align-top">
                            <div className="mb-2 text-slate-800 font-medium whitespace-pre-wrap">
                              {ac.description}
                            </div>
                            <div className="flex justify-between items-center mb-4">
                              <div className="text-[10px] text-slate-400 font-semibold italic">Uploaded by {ac.uploader} at {ac.uploadTime}</div>
                              {!ac.reply && acReplyId !== ac.id ? (
                                <button onClick={() => setAcReplyId(ac.id)} className="text-brand font-bold hover:underline bg-brand/5 px-3 py-1 rounded-md text-[10px] transition-all hover:bg-brand/10 uppercase tracking-wider">REPLY</button>
                              ) : ac.reply ? (
                                <div className="bg-emerald-100 text-emerald-700 p-1 rounded-full shadow-sm"><CheckCircle className="w-3.5 h-3.5" /></div>
                              ) : null}
                            </div>
                            
                            {/* Reply Display */}
                            {ac.reply && (
                              <div className="mt-3 bg-slate-100 p-3 rounded-lg border border-slate-200 relative">
                                <div className="absolute -top-2.5 left-4 bg-slate-100 px-1 text-[10px] font-bold text-slate-500 uppercase">{ac.reply.authorRole} Reply</div>
                                <p className="text-sm text-slate-700 mt-1">{ac.reply.text}</p>
                                {ac.reply.image && (
                                  <div className="mt-2 text-xs font-semibold text-brand flex items-center bg-brand/5 w-max px-2 py-1 rounded border border-brand/10 cursor-pointer">
                                    <ImageIcon className="w-3.5 h-3.5 mr-1" /> View Attached Image
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400 mt-2 text-right">{ac.reply.time}</div>
                              </div>
                            )}

                            {/* Reply Form */}
                            {acReplyId === ac.id && !ac.reply && (
                              <div className="mt-3 bg-white p-3 rounded-lg border border-brand/20 shadow-md">
                                <textarea 
                                  value={acReplyText}
                                  onChange={e => setAcReplyText(e.target.value)}
                                  placeholder="Type your reply here..."
                                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white mb-2 min-h-[80px]"
                                ></textarea>
                                <div className="flex justify-between items-center">
                                  <button 
                                    onClick={() => setAcReplyImage('Reply_Attachment.png')}
                                    className={clsx(
                                      "flex items-center text-[10px] font-bold px-2 py-1 rounded transition-colors",
                                      acReplyImage ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
                                    )}
                                  >
                                    <ImageIcon className="w-3 h-3 mr-1" /> {acReplyImage ? "Image Attached" : "Attach Image"}
                                  </button>
                                  <div className="flex space-x-2">
                                    <button onClick={() => { setAcReplyId(null); setAcReplyImage(null); }} className="text-xs font-semibold px-3 py-1.5 text-slate-500 hover:text-slate-700">Cancel</button>
                                    <button onClick={() => handleAcReply(ac.id)} className="text-xs font-semibold px-3 py-1.5 bg-brand text-white rounded hover:bg-brand-dark shadow-sm transition-all active:scale-95">Send Reply</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      case 9:
        if (currentRole !== 'Design' && currentRole !== 'Site Team') return renderRestrictedArea(stepInfo.title);

        const handleAddFinalResponse = () => {
          if (!frDrawingsFile && !frReportFile) {
            alert('Please upload at least one final submission file (Drawings or Report).');
            return;
          }
          const newResp = {
            id: finalResponses.length + 1,
            drawingsCount: frDrawingsCount,
            drawingsFile: frDrawingsFile,
            reportFile: frReportFile,
            date: new Date().toISOString().slice(0, 10),
            uploader: currentRole
          };
          const updated = [newResp, ...finalResponses];
          setFinalResponses(updated);
          setFrDrawingsFile(null);
          setFrReportFile(null);
          syncWithDatabase({ finalResponses: updated });
        };

        return (
          <Card title="Final Response Submission">
            <p className="text-sm text-slate-500 mb-6">Upload the finalized response to authority comments.</p>
            
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
              <h4 className="text-sm font-bold text-slate-700 mb-4">Record Final Submission</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">No. of Drawings Submitted</label>
                  <input type="number" value={frDrawingsCount} onChange={e => setFrDrawingsCount(e.target.value)} min="0" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Final Response (DRAWINGS)</label>
                  <div 
                    onClick={() => setFrDrawingsFile('Final_Drawings_Set.zip')}
                    className={clsx(
                      "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center mb-4",
                      frDrawingsFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <UploadCloud className={clsx("w-5 h-5 mb-1", frDrawingsFile ? "text-emerald-500" : "text-slate-400")} />
                    <span className="text-xs font-medium text-slate-600">{frDrawingsFile || "Upload Drawings"}</span>
                  </div>

                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Final Response (REPORT)</label>
                  <div 
                    onClick={() => setFrReportFile('Final_Authority_Report.pdf')}
                    className={clsx(
                      "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
                      frReportFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <UploadCloud className={clsx("w-5 h-5 mb-1", frReportFile ? "text-emerald-500" : "text-slate-400")} />
                    <span className="text-xs font-medium text-slate-600">{frReportFile || "Upload Report"}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t border-slate-200 pt-4 space-x-3">
                <Button variant="secondary" icon={Bell} onClick={() => alert('Reminder to input submission results sent.')}>Remind Result Input</Button>
                <Button variant="primary" icon={Save} onClick={handleAddFinalResponse}>Record Submission</Button>
              </div>
            </div>

            {finalResponses.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Final Responses History</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4">Submission Date</th>
                        <th className="px-5 py-4">Drawings Count</th>
                        <th className="px-5 py-4">File</th>
                        <th className="px-5 py-4">Uploader</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {finalResponses.map((fr) => (
                        <tr key={fr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-800">{fr.date}</td>
                          <td className="px-5 py-4">{fr.drawingsCount}</td>
                          <td className="px-5 py-4 space-y-1">
                            {fr.drawingsFile && (
                              <a href="#" className="flex items-center text-brand font-semibold hover:underline text-xs" onClick={(e) => e.preventDefault()}>
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                DRAWINGS: {fr.drawingsFile}
                              </a>
                            )}
                            {fr.reportFile && (
                              <a href="#" className="flex items-center text-brand font-semibold hover:underline text-xs" onClick={(e) => e.preventDefault()}>
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                REPORT: {fr.reportFile}
                              </a>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600">{fr.uploader}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      case 10:
        const handleAddApproval = () => {
          if (!appRef.trim() || (!appPdf && !appDrawingsFile)) {
            alert('Please provide Approval Reference and at least one document (Letter or Drawings).');
            return;
          }
          const newApp = {
            id: approvals.length + 1,
            status: appStatus,
            date: appDate,
            ref: appRef,
            drawingsFile: appDrawingsFile,
            pdf: appPdf,
            conditions: appConditions,
            recorder: currentRole
          };
          const updated = [newApp, ...approvals];
          setApprovals(updated);
          setAppPdf(null);
          setAppDrawingsFile(null);
          setAppRef('');
          setAppConditions('');
          syncWithDatabase({ approvals: updated });
        };

        const getStatusColor = (status) => {
          if (status.includes('Approved with')) return 'bg-yellow-100 text-yellow-800';
          if (status === 'Approved') return 'bg-emerald-100 text-emerald-800';
          if (status === 'Disapproval' || status === 'Rejected') return 'bg-red-100 text-red-800';
          if (status === 'Withdraw and Resubmission' || status === 'Withdrawn') return 'bg-orange-100 text-orange-800';
          return 'bg-slate-100 text-slate-800';
        };

        return (
          <Card title="Approval & Record Register">
            <p className="text-sm text-slate-500 mb-6">Establish the final "Single Source of Truth" for construction-ready documents.</p>
            
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
              <h4 className="text-sm font-bold text-slate-700 mb-4">Record Authority Decision</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Approval Status</label>
                  <select value={appStatus} onChange={e => setAppStatus(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white font-semibold">
                    <option value="Approved">Approved</option>
                    <option value="Approved with conditions">Approved with conditions</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Withdraw and Resubmission">Withdraw and Resubmission</option>
                    <option value="Disapproval">Disapproval</option>
                    <option value="Not required">Not required</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Approval Date</label>
                  <input type="date" value={appDate} onChange={e => setAppDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Approval Reference No.</label>
                  <input type="text" value={appRef} onChange={e => setAppRef(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white" placeholder="e.g. BD-2026-991" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">UPLOAD APPROVAL LETTER</label>
                  <div 
                    onClick={() => setAppPdf('Official_Approval_Letter.pdf')}
                    className={clsx(
                      "border border-dashed rounded-lg p-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center mb-3",
                      appPdf ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <span className="text-xs font-medium text-slate-600 flex items-center justify-center">
                      <UploadCloud className={clsx("w-4 h-4 mr-1", appPdf ? "text-emerald-500" : "text-slate-400")} />
                      {appPdf || "Upload PDF"}
                    </span>
                  </div>

                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">UPLOAD APPROVAL DRAWINGS</label>
                  <div 
                    onClick={() => setAppDrawingsFile('Approved_Drawings_Set.zip')}
                    className={clsx(
                      "border border-dashed rounded-lg p-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
                      appDrawingsFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
                    )}
                  >
                    <span className="text-xs font-medium text-slate-600 flex items-center justify-center">
                      <UploadCloud className={clsx("w-4 h-4 mr-1", appDrawingsFile ? "text-emerald-500" : "text-slate-400")} />
                      {appDrawingsFile || "Upload Drawings"}
                    </span>
                  </div>
                </div>
              </div>
              {appStatus === 'Approved with conditions' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-1.5">Conditions / Remarks</label>
                  <textarea value={appConditions} onChange={e => setAppConditions(e.target.value)} placeholder="Specify conditions..." className="w-full rounded-md border border-yellow-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 bg-yellow-50 min-h-[60px]"></textarea>
                </div>
              )}
              <div className="flex justify-end border-t border-slate-200 pt-4 space-x-3">
                <Button variant="secondary" icon={Send} onClick={() => alert('Approval Result Broadcasted to Departments!')}>Broadcast Result</Button>
                <Button variant="primary" icon={CheckCircle} onClick={handleAddApproval}>Finalize & Lock Record</Button>
              </div>
            </div>

            {approvals.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Official Records Register</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4">Ref & Date</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 w-1/3">Approved Drawings</th>
                        <th className="px-5 py-4">Documents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {approvals.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 align-top">
                            <div className="font-bold text-slate-800">{app.ref}</div>
                            <div className="text-xs text-slate-500">{app.date}</div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide", getStatusColor(app.status))}>{app.status}</span>
                            {app.conditions && <p className="text-xs mt-2 text-slate-600 italic">Cond: {app.conditions}</p>}
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2">
                              {app.pdf && (
                                <a href="#" className="flex items-center text-brand font-semibold hover:underline text-xs" onClick={(e) => e.preventDefault()}>
                                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Letter: {app.pdf}
                                </a>
                              )}
                              {app.drawingsFile && (
                                <a href="#" className="flex items-center text-brand font-semibold hover:underline text-xs" onClick={(e) => e.preventDefault()}>
                                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Drawings: {app.drawingsFile}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-right">
                             <button className="text-[10px] font-bold text-slate-400 hover:text-brand transition-colors uppercase">View Record</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      case 11:
        const handleAddCostTracking = () => {
          if (!ctCostImpact.trim()) {
            alert('Please provide cost impact estimates.');
            return;
          }
          const newTracking = {
            id: costTrackings.length + 1,
            cost: ctCostImpact,
            schedule: ctScheduleImpact || 'No impact',
            date: new Date().toISOString().slice(0, 10),
            recorder: currentRole
          };
          const updated = [newTracking, ...costTrackings];
          setCostTrackings(updated);
          setCtCostImpact('');
          setCtScheduleImpact('');
          syncWithDatabase({ costTrackings: updated });
        };

        return (
          <Card title="Quantity & Cost Tracking">
            <p className="text-sm text-slate-500 mb-6">Link design revisions directly with quantity and cost impacts to maintain real-time cost trends.</p>
            
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-600" /> Record Cost & Schedule Impacts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cost Implications / Estimates</label>
                  <textarea value={ctCostImpact} onChange={e => setCtCostImpact(e.target.value)} placeholder="e.g. Additional 15% steel tonnage required..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white min-h-[80px]"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Schedule / Condition Impact</label>
                  <textarea value={ctScheduleImpact} onChange={e => setCtScheduleImpact(e.target.value)} placeholder="e.g. Delays foundation start by 2 weeks due to condition 3..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white min-h-[80px]"></textarea>
                </div>
              </div>
              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button variant="primary" icon={Save} onClick={handleAddCostTracking}>Update Cost Trend</Button>
              </div>
            </div>

            {costTrackings.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Cost & Impact Trend Log</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4 w-32">Recorded Date</th>
                        <th className="px-5 py-4">Cost Implications</th>
                        <th className="px-5 py-4">Schedule Impact</th>
                        <th className="px-5 py-4 w-32">Recorder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {costTrackings.map((ct) => (
                        <tr key={ct.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-800 align-top">{ct.date}</td>
                          <td className="px-5 py-4 align-top text-emerald-700 font-medium">{ct.cost}</td>
                          <td className="px-5 py-4 align-top text-orange-700 font-medium">{ct.schedule}</td>
                          <td className="px-5 py-4 align-top">
                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-md text-slate-600 uppercase">{ct.recorder}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      default:
        return (
          <Card title={stepInfo.title}>
            <p className="text-slate-500 text-sm mb-4">
              Implementation logic for this step is currently optimized for your role: <span className="font-bold text-brand px-2 py-1 bg-brand-light rounded-md">{currentRole}</span>.
            </p>
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 border-dashed text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">Additional {stepInfo.title} forms and tables will be rendered here.</p>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="relative mt-8">
      <div className="flex items-center mb-8 pb-4 border-b border-slate-200">
        <div className="bg-brand text-white w-10 h-10 rounded-lg flex items-center justify-center mr-4 text-xl font-bold shadow-sm">
          {currentStep}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{stepInfo?.title}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Role active: {currentRole}</p>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderStepContent()}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
