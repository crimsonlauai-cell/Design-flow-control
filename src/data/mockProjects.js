export const mockProjects = [
  {
    id: 'P4010B',
    name: 'Lung Tin Tsuen (P4010B)',
    type: 'Project',
    status: 'Active',
    description: 'Foundation, ELS and Pile Cap Works (Podium Carpark Scheme) for Proposed Residential Development at Lung Tin Tsuen Phase 4, Yuen Long',
    details: {
      commencementDate: '2026-04-20',
      completionDate: '2027-07-13',
      companyNameEnglish: 'Kin Wing Foundations Limited',
      companyNameChinese: '建榮地基有限公司',
      companyCode: 'KWF',
      projectNameChinese: '龍田村第四期 (P4010B)',
      district: 'New Territories',
      address: 'Lung Tin Tsuen Phase 4, Yuen Long',
      client: 'Fortune Land Development Limited',
      mainContractor: 'Kin Wing Foundations Limited',
      consultant: 'LWK & Partners (HK) Limited',
      scopeOfWorks: 'Foundation, ELS and Pile Cap Works',
      googleMapLink: 'https://maps.app.goo.gl/nybEtUM5LNexEscM9'
    },
    packages: [
      {
        id: 'Foundation',
        name: 'Foundation',
        submissions: [
          { id: 'sub-1', name: '1st Submission', date: '2026-05-01', status: 'Approved' },
          { id: 'sub-2', name: '1st Amendment', date: '2026-05-10', status: 'In Progress' }
        ]
      },
      { id: 'PileCap', name: 'Pile Cap', submissions: [{ id: 'sub-1', name: '1st Submission', date: '2026-05-15', status: 'Drafting' }] },
      { id: 'ELS', name: 'ELS', submissions: [] }
    ]
  },
  {
    id: 'P4013',
    name: 'Shing Tak Street',
    type: 'Project',
    status: 'Active',
    description: 'Foundation, ELS and Pile Cap Works for Shing Tak Street',
    details: {
      commencementDate: '2025-02-12',
      completionDate: '2026-09-04',
      companyNameEnglish: 'Kin Wing Foundations Limited',
      companyNameChinese: '建榮地基有限公司',
      companyCode: 'KWF',
      projectNameChinese: '盛德街',
      district: 'Kowloon',
      address: 'Shing Tak Street',
      client: 'Sino',
      mainContractor: 'Kin Wing Foundations Limited',
      consultant: '',
      scopeOfWorks: 'Foundation, ELS & Pile Cap',
      googleMapLink: 'https://maps.app.goo.gl/h4AEQQVv7sStbTVQ9'
    },
    packages: [
      {
        id: 'Foundation',
        name: 'Foundation',
        submissions: [
          { id: 'sub-1', name: '1st Submission', date: '2025-03-01', status: 'Approved' },
          { id: 'sub-2', name: '1st Amendment', date: '2025-06-15', status: 'Approved with Comments' }
        ]
      },
      { id: 'ELS', name: 'ELS', submissions: [{ id: 'sub-1', name: '1st Submission', date: '2025-04-10', status: 'In Progress' }] },
      { id: 'PileCap', name: 'Pile Cap', submissions: [] }
    ]
  },
  {
    id: 'P4082',
    name: 'Tung Chung East Station',
    type: 'Project',
    status: 'Active',
    description: 'Foundation, Excavation and Lateral Support and Pile Cap for Proposed Residential Development at Site B of TCTL53, Tung Chung East Station Package 1',
    details: {
      commencementDate: '',
      completionDate: '',
      companyNameEnglish: 'Kin Wing Engineering Company Limited',
      companyNameChinese: '建榮工程有限公司',
      companyCode: 'KWE',
      projectNameChinese: '東涌東站',
      district: 'New Territories',
      address: 'Tung Chung East Station',
      client: 'Win Channel Development',
      mainContractor: '',
      consultant: '',
      scopeOfWorks: 'Foundation, ELS and Pile Cap Works',
      googleMapLink: 'https://maps.app.goo.gl/MEFVb2FRAbSJN7Y1A'
    },
    packages: [
      { id: 'Foundation', name: 'Foundation', submissions: [] },
      { id: 'ELS', name: 'ELS', submissions: [] },
      { id: 'PileCap', name: 'Pile Cap', submissions: [] }
    ]
  }
];

export const getProjectById = (id) => mockProjects.find(p => p.id === id);

export const getPackageById = (projectId, packageId) => {
  const project = getProjectById(projectId);
  return project?.packages.find(p => p.id === packageId);
};

export const getSubmissionById = (projectId, packageId, submissionId) => {
  const pkg = getPackageById(projectId, packageId);
  return pkg?.submissions.find(s => s.id === submissionId);
};
