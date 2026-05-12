import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export default function Timeline() {
  const { currentStep, setCurrentStep, steps } = useAppContext();

  return (
    <div className="w-full py-10">
      <div className="w-full relative px-2 sm:px-6">
        <div className="relative flex items-center justify-between w-full">
          {/* Background Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200 rounded-full" />
          
          {/* Progress Line */}
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand rounded-full origin-left"
            initial={false}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />

          {/* Steps */}
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="relative flex flex-col items-center group z-10">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={clsx(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center relative transition-colors duration-200 border-2",
                    isCompleted ? "bg-brand border-brand text-white" : 
                    isCurrent ? "bg-white border-brand text-brand" : 
                    "bg-white border-slate-300 text-slate-400 group-hover:border-slate-400"
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <span className="text-[10px] sm:text-sm font-semibold">{step.id}</span>}
                  
                  {isCurrent && (
                    <motion.div
                      layoutId="active-step-ring"
                      className="absolute -inset-1.5 sm:-inset-2 rounded-full border-2 border-brand/30"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
                
                {/* Step Title */}
                <div className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2 w-16 sm:w-20 text-center">
                  <span className={clsx(
                    "text-[9px] sm:text-[11px] font-medium leading-tight inline-block",
                    isCurrent ? "text-brand font-bold" : isCompleted ? "text-slate-700" : "text-slate-400"
                  )}>
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
