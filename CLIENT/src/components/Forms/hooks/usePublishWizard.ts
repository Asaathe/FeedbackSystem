import { useState, useCallback } from "react";

export function usePublishWizard(totalSteps: number = 3) {
  const [currentWizardStep, setCurrentWizardStep] = useState(1);

  const nextWizardStep = useCallback(() => {
    if (currentWizardStep < totalSteps) {
      setCurrentWizardStep(currentWizardStep + 1);
    }
  }, [currentWizardStep, totalSteps]);

  const prevWizardStep = useCallback(() => {
    if (currentWizardStep > 1) {
      setCurrentWizardStep(currentWizardStep - 1);
    }
  }, [currentWizardStep]);

  const resetWizard = useCallback(() => {
    setCurrentWizardStep(1);
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentWizardStep(step);
    }
  }, [totalSteps]);

  return {
    currentWizardStep,
    totalWizardSteps: totalSteps,
    nextWizardStep,
    prevWizardStep,
    resetWizard,
    goToStep,
  };
}
