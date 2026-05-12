import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const roles = ['Design', 'Site Team', 'QS', 'Procurement', 'Tender'];

export const steps = [
  { id: 1, title: 'Project Initiation' },
  { id: 2, title: 'Stakeholder & Timeline' },
  { id: 3, title: 'Submission Schedule' },
  { id: 4, title: 'Design Input' },
  { id: 5, title: 'Internal Draft' },
  { id: 6, title: 'Internal Review' },
  { id: 7, title: 'Formal Submission' },
  { id: 8, title: 'Consultant Feedback' },
  { id: 9, title: 'Statutory Tracking' },
  { id: 10, title: 'Authority Comment' },
  { id: 11, title: 'Final Response' },
  { id: 12, title: 'Approval Register' },
  { id: 13, title: 'Quantity & Cost' }
];

export const AppProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(roles[0]);
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <AppContext.Provider value={{ currentRole, setCurrentRole, currentStep, setCurrentStep, roles, steps }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
