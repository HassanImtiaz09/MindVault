import React, { createContext, useCallback, useContext, useState } from "react";

export type TransitionType = "burst" | "radial" | "sweep" | "sparkle";

interface TransitionContextValue {
  triggerTransition: (type?: TransitionType) => void;
  isTransitioning: boolean;
  transitionType: TransitionType;
  onTransitionComplete: () => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  triggerTransition: () => {},
  isTransitioning: false,
  transitionType: "burst",
  onTransitionComplete: () => {},
});

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<TransitionType>("burst");

  const triggerTransition = useCallback((type: TransitionType = "burst") => {
    setTransitionType(type);
    setIsTransitioning(true);
  }, []);

  const onTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return (
    <TransitionContext.Provider
      value={{ triggerTransition, isTransitioning, transitionType, onTransitionComplete }}
    >
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  return useContext(TransitionContext);
}
