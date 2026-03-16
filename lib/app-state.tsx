import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Subscription tiers
export type SubscriptionTier = "basic" | "pro";

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  priceMonthly: number;
  memoryLimit: number;
  folderLimit: number;
  features: string[];
}

export const PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  basic: {
    tier: "basic",
    name: "Basic",
    price: "Free",
    priceMonthly: 0,
    memoryLimit: 50,
    folderLimit: 3,
    features: [
      "Up to 50 memories",
      "3 folders",
      "Text notes & web links",
      "Basic AI summaries",
      "Search & filter",
      "Weekly summary",
    ],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: "$9.99/mo",
    priceMonthly: 9.99,
    memoryLimit: -1, // unlimited
    folderLimit: -1,
    features: [
      "Unlimited memories",
      "Unlimited folders",
      "All capture types (images, voice, PDFs, DOCX)",
      "Advanced AI document analysis",
      "Contract & medical report analysis",
      "Market research from documents",
      "Report generation",
      "Export as PDF",
      "Push notification reminders",
      "Priority AI processing",
      "Knowledge graph visualization",
      "Idea generation",
    ],
  },
};

interface AppState {
  isGuest: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenTutorial: Record<string, boolean>;
  subscription: SubscriptionTier;
  favorites: number[];
  notificationsEnabled: boolean;
  captureReminderTime: string; // "HH:mm"
}

interface AppStateContextType extends AppState {
  setGuest: (v: boolean) => void;
  completeOnboarding: () => void;
  markTutorialSeen: (key: string) => void;
  setSubscription: (tier: SubscriptionTier) => void;
  toggleFavorite: (memoryId: number) => void;
  isFavorite: (memoryId: number) => boolean;
  setNotificationsEnabled: (v: boolean) => void;
  setCaptureReminderTime: (time: string) => void;
  canUseFeature: (feature: string) => boolean;
  getMemoryLimit: () => number;
  getFolderLimit: () => number;
  currentPlan: SubscriptionPlan;
  loaded: boolean;
}

const defaultState: AppState = {
  isGuest: false,
  hasCompletedOnboarding: false,
  hasSeenTutorial: {},
  subscription: "basic",
  favorites: [],
  notificationsEnabled: false,
  captureReminderTime: "09:00",
};

const AppStateContext = createContext<AppStateContextType>({
  ...defaultState,
  setGuest: () => {},
  completeOnboarding: () => {},
  markTutorialSeen: () => {},
  setSubscription: () => {},
  toggleFavorite: () => {},
  isFavorite: () => false,
  setNotificationsEnabled: () => {},
  setCaptureReminderTime: () => {},
  canUseFeature: () => true,
  getMemoryLimit: () => 50,
  getFolderLimit: () => 3,
  currentPlan: PLANS.basic,
  loaded: false,
});

const STORAGE_KEY = "@mindvault_app_state";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setState((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((newState: AppState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
  }, []);

  const update = useCallback((partial: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      persist(next);
      return next;
    });
  }, [persist]);

  const setGuest = useCallback((v: boolean) => update({ isGuest: v }), [update]);
  const completeOnboarding = useCallback(() => update({ hasCompletedOnboarding: true }), [update]);
  const markTutorialSeen = useCallback((key: string) => {
    setState((prev) => {
      const next = { ...prev, hasSeenTutorial: { ...prev.hasSeenTutorial, [key]: true } };
      persist(next);
      return next;
    });
  }, [persist]);
  const setSubscription = useCallback((tier: SubscriptionTier) => update({ subscription: tier }), [update]);

  const toggleFavorite = useCallback((memoryId: number) => {
    setState((prev) => {
      const favs = prev.favorites.includes(memoryId)
        ? prev.favorites.filter((id) => id !== memoryId)
        : [...prev.favorites, memoryId];
      const next = { ...prev, favorites: favs };
      persist(next);
      return next;
    });
  }, [persist]);

  const isFavorite = useCallback((memoryId: number) => state.favorites.includes(memoryId), [state.favorites]);
  const setNotificationsEnabled = useCallback((v: boolean) => update({ notificationsEnabled: v }), [update]);
  const setCaptureReminderTime = useCallback((time: string) => update({ captureReminderTime: time }), [update]);

  const proFeatures = ["document_analysis", "voice_capture", "image_capture", "export_pdf", "report_generation", "market_research", "idea_generation", "knowledge_graph", "push_notifications", "unlimited_memories", "unlimited_folders", "advanced_ai"];

  const canUseFeature = useCallback((feature: string) => {
    if (state.subscription === "pro") return true;
    return !proFeatures.includes(feature);
  }, [state.subscription]);

  const getMemoryLimit = useCallback(() => PLANS[state.subscription].memoryLimit, [state.subscription]);
  const getFolderLimit = useCallback(() => PLANS[state.subscription].folderLimit, [state.subscription]);

  return (
    <AppStateContext.Provider
      value={{
        ...state,
        setGuest,
        completeOnboarding,
        markTutorialSeen,
        setSubscription,
        toggleFavorite,
        isFavorite,
        setNotificationsEnabled,
        setCaptureReminderTime,
        canUseFeature,
        getMemoryLimit,
        getFolderLimit,
        currentPlan: PLANS[state.subscription],
        loaded,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
