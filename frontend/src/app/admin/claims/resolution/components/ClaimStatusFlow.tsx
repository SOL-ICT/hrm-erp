/**
 * Claim Status Flow Component
 * 
 * Visual 5-step progress indicator showing claim lifecycle.
 * Handles both normal (5-step) and declined (3-step) paths.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Claims Lifecycle
 */

interface ClaimStatusFlowProps {
  status: 'client_reported' | 'sol_under_review' | 'sol_accepted' | 'sol_declined' | 'insurer_processing' | 'insurer_settled';
}

export default function ClaimStatusFlow({ status }: ClaimStatusFlowProps) {
  const isDeclined = status === 'sol_declined';
  
  const normalSteps = [
    { id: 'client_reported', label: 'Client Report', icon: '📞' },
    { id: 'sol_under_review', label: 'SOL Review', icon: '🔍' },
    { id: 'sol_accepted', label: 'SOL Accepted', icon: '✅' },
    { id: 'insurer_processing', label: 'Insurer Processing', icon: '🏢' },
    { id: 'insurer_settled', label: 'Settled', icon: '💰' }
  ];

  const declinedSteps = [
    { id: 'client_reported', label: 'Client Report', icon: '📞' },
    { id: 'sol_under_review', label: 'SOL Review', icon: '🔍' },
    { id: 'sol_declined', label: 'Declined', icon: '❌' }
  ];

  const steps = isDeclined ? declinedSteps : normalSteps;

  const getStepStatus = (stepId: string) => {
    const statusOrder = ['client_reported', 'sol_under_review', 'sol_accepted', 'insurer_processing', 'insurer_settled'];
    const declinedOrder = ['client_reported', 'sol_under_review', 'sol_declined'];
    
    const order = isDeclined ? declinedOrder : statusOrder;
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-3">
      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Claim Progress</h4>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              {/* Connector line */}
              {index > 0 && (
                <div 
                  className={`absolute left-0 top-5 w-full h-0.5 -ml-[50%] ${
                    stepStatus === 'completed' ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ zIndex: 1 }}
                />
              )}
              
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-base relative ${
                  stepStatus === 'completed' ? 'bg-green-500 text-white' :
                  stepStatus === 'current' ? 'bg-blue-500 text-white' :
                  'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
                style={{ zIndex: 2 }}
              >
                {step.icon}
              </div>
              
              {/* Step label */}
              <span className={`text-[10px] mt-1 text-center font-medium ${
                stepStatus === 'current' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
