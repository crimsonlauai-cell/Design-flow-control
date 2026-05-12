import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProjectById } from '../data/mockProjects';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, MessageSquare, Save, Link as LinkIcon, Image as ImageIcon, AlertCircle, Calendar, Bell, ShieldCheck, DollarSign, Send, Clock } from 'lucide-react';
import clsx from 'clsx';

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6 ${className}`}>
      <h3 className="text-lg font-bold text-brand mb-6 border-b pb-3">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, type = 'text', defaultValue = '', colSpan = 1 }) {
  return (
    <div className={`mb-4 ${colSpan > 1 ? `col-span-${colSpan}` : ''}`}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea 
          defaultValue={defaultValue}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50/50"
        />
      ) : (
        <input 
          type={type} 
          defaultValue={defaultValue}
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

export default function StepViews() {
  const { currentStep, currentRole, steps } = useAppContext();
  const { projectId, packageId, submissionId } = useParams();
  
  const stepInfo = steps.find(s => s.id === currentStep);
  const project = getProjectById(projectId) || {};
  const details = project.details || {};

  const pkg = project.packages?.find(p => p.id === packageId) || {};
  const submission = pkg.submissions?.find(s => s.id === submissionId) || {};

  const [submissionDate, setSubmissionDate] = useState('');
  const [approvalDate, setApprovalDate] = useState('');
  const [isFirstSubmission, setIsFirstSubmission] = useState(submission?.name?.includes('1st Submission') || false);

  const [inputProvider, setInputProvider] = useState('Client');
  const [inputReceiveDate, setInputReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadedInputs, setUploadedInputs] = useState([
    { id: 1, filename: 'Site_Survey_Report.pdf', providerType: 'Consultant', providerName: details.consultant || 'N/A', receiveDate: '2026-05-10' }
  ]);

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

  const handleUploadDraft = () => {
    const nextVersion = `D${drafts.length}`;
    const now = new Date();
    const timeString = now.toLocaleString('zh-HK', { hour12: false });
    
    setDrafts(prev => [{
      id: prev.length + 1,
      version: nextVersion,
      uploadTime: timeString,
      filename: `Submission_Draft_${nextVersion}.pdf`,
    }, ...prev]);
    setIsDraftNotified(false);
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
              <Button icon={Save} variant="primary">Generate & Save Profile</Button>
            </div>
          </Card>
        );
      case 2:
        return (
          <Card title="Stakeholder & Timeline Setup">
            <p className="text-sm text-slate-500 mb-6">Assign responsibilities and define the critical path for the project scopes.</p>
            
            {/* Related Person in Charge */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-700 bg-blue-50/80 px-5 py-2.5 border-b border-blue-100 rounded-t-lg">Related Person in Charge</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-5 border border-t-0 border-slate-200 rounded-b-lg bg-white">
                <Input label="PD" />
                <Input label="EIC" />
                <Input label="PIC" />
                <Input label="Safety" />
                <Input label="Site Representative" />
                <Input label="QA" />
                <Input label="Design" />
                <Input label="Project Secretary" />
                <Input label="PQS" />
                <Input label="Plant Representative" />
                <Input label="Procurement" />
                <Input label="Electrician" />
              </div>
            </div>

            {/* Site Team */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-700 bg-blue-50/80 px-5 py-2.5 border-b border-blue-100 rounded-t-lg">Site Team</h4>
              <div className="grid grid-cols-1 gap-y-1 p-5 border border-t-0 border-slate-200 rounded-b-lg bg-white">
                <Input label="Supervisor and Engineer" type="textarea" />
                <Input label="Administration Staff" type="textarea" />
                <Input label="Others Staff" type="textarea" />
              </div>
            </div>

            {/* Timeline Setup by Scope */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-700 bg-blue-50/80 px-5 py-2.5 border-b border-blue-100 rounded-t-lg">Timeline Setup by Scope</h4>
              <div className="p-5 border border-t-0 border-slate-200 rounded-b-lg bg-white">
                <div className="grid grid-cols-12 gap-4 mb-3 px-2 hidden md:grid border-b border-slate-100 pb-2">
                  <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope of Works</div>
                  <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Start Date</div>
                  <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected End Date</div>
                </div>
                
                {['Foundation', 'Pile Cap', 'ELS', 'Hoarding', 'Steel Platform', 'Others'].map((scope) => (
                  <div key={scope} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-md">
                    <div className="col-span-4 font-medium text-slate-700 text-sm flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand mr-2"></span>
                      {scope}
                    </div>
                    <div className="col-span-4">
                      <span className="md:hidden text-xs text-slate-500 uppercase font-semibold block mb-1">Expected Start Date</span>
                      <input type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800" />
                    </div>
                    <div className="col-span-4">
                      <span className="md:hidden text-xs text-slate-500 uppercase font-semibold block mb-1">Expected End Date</span>
                      <input type="date" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white text-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t pt-6">
              <Button icon={Save} variant="primary">Save Stakeholders & Timeline</Button>
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
                  <Input label="Package Title" defaultValue={`${pkg.name || ''} - ${submission.name || ''}`} />
                  <Input label="Purpose & Context" type="textarea" />
                  
                  {/* File Upload Area */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supporting Documents</label>
                    <div className="border-2 border-dashed border-slate-300 bg-white rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-brand mx-auto mb-2 transition-colors" />
                      <p className="text-sm text-slate-600">Drag & drop files or click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">Upload context docs, BD/ASD guidelines</p>
                    </div>
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
                  <Input label="Start Date" type="date" />
                  <Input label="Target Design Completion Date" type="date" />
                  <Input label="Target Review & Reply Completion Date" type="date" />
                  
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
              <Button icon={Save} variant="primary">Save Package Schedule</Button>
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
                  
                  <div className="border-2 border-dashed border-brand/30 bg-white rounded-lg p-6 text-center hover:bg-brand/5 transition-colors cursor-pointer group mt-2">
                    <UploadCloud className="w-8 h-8 text-brand mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <p className="text-sm text-slate-600 font-medium">Click to Browse or Drag & Drop Input Files</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DWG, RVT, Images up to 500MB</p>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button icon={Save} variant="primary">Save & Register Record</Button>
                  </div>
                </div>

                {/* Uploaded Records Table */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Registered Inputs</h4>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">File Name</th>
                          <th className="px-4 py-3">Provider Role</th>
                          <th className="px-4 py-3">Provider Name</th>
                          <th className="px-4 py-3">Date Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {uploadedInputs.map(file => (
                          <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-brand hover:underline cursor-pointer flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-slate-400" />
                              {file.filename}
                            </td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{file.providerType}</span></td>
                            <td className="px-4 py-3">{file.providerName}</td>
                            <td className="px-4 py-3">{file.receiveDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
        const latestDraft = drafts[0];

        return (
          <Card title="Internal Draft Issuance">
            <p className="text-sm text-slate-500 mb-6">Upload the design draft for internal review by QS, Site Team, Tender, and Procurement.</p>
            
            {/* Upload Area */}
            {currentRole === 'Design' ? (
              <div onClick={handleUploadDraft} className="border-2 border-dashed border-brand/30 bg-white rounded-xl p-10 text-center hover:bg-brand/5 transition-colors cursor-pointer group mb-8">
                <UploadCloud className="w-10 h-10 text-brand mx-auto mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                <h4 className="text-lg font-bold text-slate-800 flex items-center justify-center">
                  Drag & Drop Draft Document Here
                </h4>
                <p className="text-sm text-slate-500 mt-2">Target Revision: <span className="font-bold text-brand bg-brand/10 px-2 py-0.5 rounded ml-1">{currentDraftVersion}</span></p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, DWG up to 500MB</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-4 rounded-full text-brand shadow-inner">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg flex items-center">
                      Target Revision: <span className="ml-2 bg-brand text-white px-2 py-0.5 rounded text-sm">{currentDraftVersion}</span>
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">Pending upload by Design In-charge</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400 italic">Only Design role can upload</div>
              </div>
            )}

            {/* Draft History Table */}
            {drafts.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Draft Issuance History</h4>
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
                          <td className="px-5 py-4 font-medium text-brand hover:underline cursor-pointer flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-slate-400" />
                            {draft.filename}
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
                            {idx === 0 && currentRole === 'Design' && !isDraftNotified ? (
                              <button 
                                onClick={() => setIsDraftNotified(true)}
                                className="inline-flex items-center justify-end px-3 py-1.5 rounded-md text-xs font-bold bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all shadow-sm"
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Notify Reviewers
                              </button>
                            ) : idx === 0 && isDraftNotified ? (
                               <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                                 <CheckCircle className="w-4 h-4 mr-1.5" /> Notified
                               </span>
                            ) : null}
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
      case 6:
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
          setComments([newComment, ...comments]);
          setNewCommentText('');
          setShowCommentForm(false);
        };

        const handleReply = (id) => {
          if (!replyText.trim() && !replyImage) return;
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          setComments(comments.map(c => 
            c.id === id ? { ...c, reply: { authorRole: currentRole, text: replyText, image: replyImage, time: timeStr } } : c
          ));
          setReplyTextId(null);
          setReplyText('');
          setReplyImage(null);
        };

        return (
          <Card title="Internal Review & Coordination">
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
          </Card>
        );
      case 7:
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
          setFormalSubmissions([newSub, ...formalSubmissions]);
          
          const nextNum = parseInt(issueRound.replace('C', '')) + 1;
          setIssueRound(`C${nextNum}`);
          setUploadRef('');
          setFormalSubmissionFile(null);
        };

        return (
          <Card title="Formal Consultant Submission">
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
          </Card>
        );
      case 8:
        if (currentRole !== 'Design' && currentRole !== 'Site Team') return renderRestrictedArea(stepInfo.title);

        const handleAddConsultantFeedback = () => {
          if (!cfFile) {
            alert('Please upload a Comment Form/Mark-up File.');
            return;
          }
          if (!cfDescription.trim()) {
            alert('Please provide a comment description.');
            return;
          }
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          const newFeedback = {
            id: `CF-${consultantFeedbacks.length + 1}`,
            date: cfReceivedDate,
            file: cfFile,
            description: cfDescription,
            uploader: currentRole,
            uploadTime: timeStr,
            reply: null
          };
          setConsultantFeedbacks([newFeedback, ...consultantFeedbacks]);
          setCfFile(null);
          setCfDescription('');
        };

        const handleCfReply = (id) => {
          if (!cfReplyText.trim() && !cfReplyImage) return;
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          setConsultantFeedbacks(consultantFeedbacks.map(cf => 
            cf.id === id ? { ...cf, reply: { authorRole: currentRole, text: cfReplyText, image: cfReplyImage, time: timeStr } } : cf
          ));
          setCfReplyId(null);
          setCfReplyText('');
          setCfReplyImage(null);
        };

        return (
          <Card title="Consultant Feedback Log">
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
          </Card>
        );
      case 9:
        if (currentRole !== 'Design' && currentRole !== 'Site Team') return renderRestrictedArea(stepInfo.title);

        const handleAddStatutorySubmission = () => {
          if (!ssRtcComplete) {
            alert('Please confirm Consultant R to C table is completed.');
            return;
            alert('Consultant R to C table must be completed before recording submission.');
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
          setStatutorySubmissions([newSub, ...statutorySubmissions]);
          setSsDrawingsFile(null);
          setSsReportFile(null);
          setSsRtcComplete(false);
          setSsNotifyDue(false);
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
      case 10:
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
          setAuthorityComments([newComment, ...authorityComments]);
          setAcFile(null);
          setAcDescription('');
        };

        const handleAcReply = (id) => {
          if (!acReplyText.trim() && !acReplyImage) return;
          const now = new Date();
          const timeStr = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          setAuthorityComments(authorityComments.map(ac => 
            ac.id === id ? { ...ac, reply: { authorRole: currentRole, text: acReplyText, image: acReplyImage, time: timeStr } } : ac
          ));
          setAcReplyId(null);
          setAcReplyText('');
          setAcReplyImage(null);
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
      case 11:
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
          setFinalResponses([newResp, ...finalResponses]);
          setFrDrawingsFile(null);
          setFrReportFile(null);
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
      case 12:
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
          setApprovals([newApp, ...approvals]);
          setAppPdf(null);
          setAppDrawingsFile(null);
          setAppRef('');
          setAppConditions('');
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
      case 13:
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
          setCostTrackings([newTracking, ...costTrackings]);
          setCtCostImpact('');
          setCtScheduleImpact('');
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
