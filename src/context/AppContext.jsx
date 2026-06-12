import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const roles = ['Design', 'Site Team', 'QS', 'Procurement', 'Tender'];

export const steps = [
  { id: 1, title: 'Project Initiation' },
  { id: 2, title: 'Key Person' },
  { id: 3, title: 'Submission Schedule' },
  { id: 4, title: 'Design Input' },
  { id: 5, title: 'Draft & Review' },
  { id: 6, title: 'Formal Submission' },
  { id: 7, title: 'Statutory Tracking' },
  { id: 8, title: 'Authority Comment' },
  { id: 9, title: 'Final Response' },
  { id: 10, title: 'Approval Register' },
  { id: 11, title: 'Quantity & Cost' }
];

export const AppProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(roles[0]);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeSteps, setActiveSteps] = useState(new Set());

  const markStepActive = (stepId) => {
    setActiveSteps(prev => {
      if (prev.has(stepId)) return prev;
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  };

  return (
    <AppContext.Provider value={{ currentRole, setCurrentRole, currentStep, setCurrentStep, roles, steps, activeSteps, markStepActive }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
