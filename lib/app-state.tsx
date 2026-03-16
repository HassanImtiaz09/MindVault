import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
    memoryLimit: -1,
    folderLimit: -1,
    features: [
      "Unlimited memories",
      "Unlimited folders",
      "All capture types (images, voice, PDFs, DOCX)",
      "Advanced AI document analysis",
      "Contract & medical report analysis",
      "Market research from documents",
      "Report generation",
      "Export & backup",
      "Focus Mode",
      "Custom tags",
      "Smart reminders",
      "Collaborative folders",
      "Daily Digest",
      "Push notification reminders",
      "Priority AI processing",
      "Knowledge graph visualization",
      "Idea generation",
    ],
  },
};

// Tag type
export interface UserTag {
  id: string;
  name: string;
  color: string;
}

// Focus session
export interface FocusSession {
  id: string;
  folderId: string;
  folderName: string;
  startedAt: string;
  durationMinutes: number;
  capturedMemoryIds: number[];
  completed: boolean;
}

// Smart reminder
export interface SmartReminder {
  id: string;
  memoryId: number;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

// Collaborative folder
export interface FolderCollaborator {
  email: string;
  role: "viewer" | "editor";
  addedAt: string;
}

export interface CollaborativeFolder {
  folderId: string;
  collaborators: FolderCollaborator[];
  isShared: boolean;
}

// Daily digest
export interface DailyDigest {
  id: string;
  date: string;
  topMemory: { id: number; title: string; summary: string } | null;
  insight: string;
  focusTopic: string;
  memoriesCount: number;
  generated: boolean;
}

interface AppState {
  isGuest: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenTutorial: Record<string, boolean>;
  subscription: SubscriptionTier;
  favorites: number[];
  notificationsEnabled: boolean;
  captureReminderTime: string;
  // Tags
  tags: UserTag[];
  memoryTags: Record<number, string[]>;
  // Focus mode
  focusSessions: FocusSession[];
  activeFocusSession: FocusSession | null;
  // Smart reminders
  reminders: SmartReminder[];
  // Collaborative folders
  collaborativeFolders: CollaborativeFolder[];
  // Daily digest
  dailyDigests: DailyDigest[];
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
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
  // Tags
  createTag: (name: string, color: string) => UserTag;
  deleteTag: (tagId: string) => void;
  addTagToMemory: (memoryId: number, tagId: string) => void;
  removeTagFromMemory: (memoryId: number, tagId: string) => void;
  getMemoryTags: (memoryId: number) => UserTag[];
  getMemoriesByTag: (tagId: string) => number[];
  // Focus mode
  startFocusSession: (folderId: string, folderName: string, durationMinutes: number) => void;
  endFocusSession: () => void;
  addMemoryToFocusSession: (memoryId: number) => void;
  // Smart reminders
  addReminder: (reminder: Omit<SmartReminder, "id" | "createdAt" | "completed">) => void;
  completeReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  getPendingReminders: () => SmartReminder[];
  // Collaborative folders
  addCollaborator: (folderId: string, email: string, role: "viewer" | "editor") => void;
  removeCollaborator: (folderId: string, email: string) => void;
  getFolderCollaborators: (folderId: string) => FolderCollaborator[];
  isFolderShared: (folderId: string) => boolean;
  // Daily digest
  setDailyDigestEnabled: (v: boolean) => void;
  setDailyDigestTime: (time: string) => void;
  addDailyDigest: (digest: Omit<DailyDigest, "id">) => void;
  getLatestDigest: () => DailyDigest | null;
}

const defaultState: AppState = {
  isGuest: false,
  hasCompletedOnboarding: false,
  hasSeenTutorial: {},
  subscription: "basic",
  favorites: [],
  notificationsEnabled: false,
  captureReminderTime: "09:00",
  tags: [],
  memoryTags: {},
  focusSessions: [],
  activeFocusSession: null,
  reminders: [],
  collaborativeFolders: [],
  dailyDigests: [],
  dailyDigestEnabled: false,
  dailyDigestTime: "08:00",
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
  createTag: () => ({ id: "", name: "", color: "" }),
  deleteTag: () => {},
  addTagToMemory: () => {},
  removeTagFromMemory: () => {},
  getMemoryTags: () => [],
  getMemoriesByTag: () => [],
  startFocusSession: () => {},
  endFocusSession: () => {},
  addMemoryToFocusSession: () => {},
  addReminder: () => {},
  completeReminder: () => {},
  deleteReminder: () => {},
  getPendingReminders: () => [],
  addCollaborator: () => {},
  removeCollaborator: () => {},
  getFolderCollaborators: () => [],
  isFolderShared: () => false,
  setDailyDigestEnabled: () => {},
  setDailyDigestTime: () => {},
  addDailyDigest: () => {},
  getLatestDigest: () => null,
});

const STORAGE_KEY = "@mindvault_app_state";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

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

  const isFavorite = useCallback((memoryId: number) => stateRef.current.favorites.includes(memoryId), []);
  const setNotificationsEnabled = useCallback((v: boolean) => update({ notificationsEnabled: v }), [update]);
  const setCaptureReminderTime = useCallback((time: string) => update({ captureReminderTime: time }), [update]);

  const proFeatures = ["document_analysis", "voice_capture", "image_capture", "export_pdf", "report_generation", "market_research", "idea_generation", "knowledge_graph", "push_notifications", "unlimited_memories", "unlimited_folders", "advanced_ai", "focus_mode", "custom_tags", "data_export", "smart_reminders", "collaborative_folders", "daily_digest"];

  const canUseFeature = useCallback((feature: string) => {
    if (stateRef.current.subscription === "pro") return true;
    return !proFeatures.includes(feature);
  }, []);

  const getMemoryLimit = useCallback(() => PLANS[stateRef.current.subscription].memoryLimit, []);
  const getFolderLimit = useCallback(() => PLANS[stateRef.current.subscription].folderLimit, []);

  // Tag functions
  const createTag = useCallback((name: string, color: string): UserTag => {
    const tag: UserTag = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, color };
    setState((prev) => {
      const next = { ...prev, tags: [...prev.tags, tag] };
      persist(next);
      return next;
    });
    return tag;
  }, [persist]);

  const deleteTag = useCallback((tagId: string) => {
    setState((prev) => {
      const newMemoryTags = { ...prev.memoryTags };
      for (const key of Object.keys(newMemoryTags)) {
        newMemoryTags[Number(key)] = newMemoryTags[Number(key)].filter((id) => id !== tagId);
      }
      const next = { ...prev, tags: prev.tags.filter((t) => t.id !== tagId), memoryTags: newMemoryTags };
      persist(next);
      return next;
    });
  }, [persist]);

  const addTagToMemory = useCallback((memoryId: number, tagId: string) => {
    setState((prev) => {
      const existing = prev.memoryTags[memoryId] || [];
      if (existing.includes(tagId)) return prev;
      const next = { ...prev, memoryTags: { ...prev.memoryTags, [memoryId]: [...existing, tagId] } };
      persist(next);
      return next;
    });
  }, [persist]);

  const removeTagFromMemory = useCallback((memoryId: number, tagId: string) => {
    setState((prev) => {
      const existing = prev.memoryTags[memoryId] || [];
      const next = { ...prev, memoryTags: { ...prev.memoryTags, [memoryId]: existing.filter((id) => id !== tagId) } };
      persist(next);
      return next;
    });
  }, [persist]);

  const getMemoryTags = useCallback((memoryId: number): UserTag[] => {
    const tagIds = stateRef.current.memoryTags[memoryId] || [];
    return stateRef.current.tags.filter((t) => tagIds.includes(t.id));
  }, []);

  const getMemoriesByTag = useCallback((tagId: string): number[] => {
    return Object.entries(stateRef.current.memoryTags)
      .filter(([_, tagIds]) => tagIds.includes(tagId))
      .map(([memId]) => Number(memId));
  }, []);

  // Focus mode functions
  const startFocusSession = useCallback((folderId: string, folderName: string, durationMinutes: number) => {
    const session: FocusSession = {
      id: Date.now().toString(36),
      folderId,
      folderName,
      startedAt: new Date().toISOString(),
      durationMinutes,
      capturedMemoryIds: [],
      completed: false,
    };
    update({ activeFocusSession: session });
  }, [update]);

  const endFocusSession = useCallback(() => {
    setState((prev) => {
      if (!prev.activeFocusSession) return prev;
      const completed = { ...prev.activeFocusSession, completed: true };
      const next = { ...prev, activeFocusSession: null, focusSessions: [...prev.focusSessions, completed] };
      persist(next);
      return next;
    });
  }, [persist]);

  const addMemoryToFocusSession = useCallback((memoryId: number) => {
    setState((prev) => {
      if (!prev.activeFocusSession) return prev;
      const next = {
        ...prev,
        activeFocusSession: {
          ...prev.activeFocusSession,
          capturedMemoryIds: [...prev.activeFocusSession.capturedMemoryIds, memoryId],
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  // Smart reminders
  const addReminder = useCallback((reminder: Omit<SmartReminder, "id" | "createdAt" | "completed">) => {
    const newReminder: SmartReminder = {
      ...reminder,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setState((prev) => {
      const next = { ...prev, reminders: [...prev.reminders, newReminder] };
      persist(next);
      return next;
    });
  }, [persist]);

  const completeReminder = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, reminders: prev.reminders.map((r) => r.id === id ? { ...r, completed: true } : r) };
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteReminder = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, reminders: prev.reminders.filter((r) => r.id !== id) };
      persist(next);
      return next;
    });
  }, [persist]);

  const getPendingReminders = useCallback((): SmartReminder[] => {
    return stateRef.current.reminders.filter((r) => !r.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, []);

  // Collaborative folders
  const addCollaborator = useCallback((folderId: string, email: string, role: "viewer" | "editor") => {
    setState((prev) => {
      const existing = prev.collaborativeFolders.find((f) => f.folderId === folderId);
      const collab: FolderCollaborator = { email, role, addedAt: new Date().toISOString() };
      let newFolders: CollaborativeFolder[];
      if (existing) {
        newFolders = prev.collaborativeFolders.map((f) =>
          f.folderId === folderId
            ? { ...f, collaborators: [...f.collaborators.filter((c) => c.email !== email), collab], isShared: true }
            : f
        );
      } else {
        newFolders = [...prev.collaborativeFolders, { folderId, collaborators: [collab], isShared: true }];
      }
      const next = { ...prev, collaborativeFolders: newFolders };
      persist(next);
      return next;
    });
  }, [persist]);

  const removeCollaborator = useCallback((folderId: string, email: string) => {
    setState((prev) => {
      const newFolders = prev.collaborativeFolders.map((f) => {
        if (f.folderId !== folderId) return f;
        const newCollabs = f.collaborators.filter((c) => c.email !== email);
        return { ...f, collaborators: newCollabs, isShared: newCollabs.length > 0 };
      });
      const next = { ...prev, collaborativeFolders: newFolders };
      persist(next);
      return next;
    });
  }, [persist]);

  const getFolderCollaborators = useCallback((folderId: string): FolderCollaborator[] => {
    return stateRef.current.collaborativeFolders.find((f) => f.folderId === folderId)?.collaborators || [];
  }, []);

  const isFolderShared = useCallback((folderId: string): boolean => {
    return stateRef.current.collaborativeFolders.find((f) => f.folderId === folderId)?.isShared || false;
  }, []);

  // Daily digest
  const setDailyDigestEnabled = useCallback((v: boolean) => update({ dailyDigestEnabled: v }), [update]);
  const setDailyDigestTime = useCallback((time: string) => update({ dailyDigestTime: time }), [update]);

  const addDailyDigest = useCallback((digest: Omit<DailyDigest, "id">) => {
    const newDigest: DailyDigest = { ...digest, id: Date.now().toString(36) };
    setState((prev) => {
      const next = { ...prev, dailyDigests: [newDigest, ...prev.dailyDigests].slice(0, 30) };
      persist(next);
      return next;
    });
  }, [persist]);

  const getLatestDigest = useCallback((): DailyDigest | null => {
    return stateRef.current.dailyDigests[0] || null;
  }, []);

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
        createTag,
        deleteTag,
        addTagToMemory,
        removeTagFromMemory,
        getMemoryTags,
        getMemoriesByTag,
        startFocusSession,
        endFocusSession,
        addMemoryToFocusSession,
        addReminder,
        completeReminder,
        deleteReminder,
        getPendingReminders,
        addCollaborator,
        removeCollaborator,
        getFolderCollaborators,
        isFolderShared,
        setDailyDigestEnabled,
        setDailyDigestTime,
        addDailyDigest,
        getLatestDigest,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
