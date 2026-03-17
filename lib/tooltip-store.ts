import AsyncStorage from "@react-native-async-storage/async-storage";

const TIPS_DISMISSED_KEY = "mindvault_tips_dismissed";

export type TipId =
  | "home_quick_capture"
  | "home_daily_digest"
  | "home_ask_ai"
  | "home_focus_mode"
  | "home_reminders"
  | "capture_text"
  | "capture_voice"
  | "capture_image"
  | "capture_document"
  | "capture_link"
  | "capture_scan"
  | "library_search"
  | "library_filter"
  | "library_favorites"
  | "library_tags"
  | "ask_question"
  | "ask_ideas"
  | "ask_suggested"
  | "insights_summary"
  | "insights_graph"
  | "insights_topics"
  | "detail_favorite"
  | "detail_share"
  | "detail_analyze"
  | "detail_tags"
  | "folders_create"
  | "folders_focus"
  | "focus_timer"
  | "focus_folder"
  | "tags_create"
  | "export_backup"
  | "collaborate_share"
  | "subscription_pro"
  | "guide_reference";

export async function getDismissedTips(): Promise<Set<TipId>> {
  try {
    const raw = await AsyncStorage.getItem(TIPS_DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as TipId[]);
  } catch {
    return new Set();
  }
}

export async function dismissTip(id: TipId): Promise<void> {
  try {
    const dismissed = await getDismissedTips();
    dismissed.add(id);
    await AsyncStorage.setItem(
      TIPS_DISMISSED_KEY,
      JSON.stringify([...dismissed])
    );
  } catch {}
}

export async function resetAllTips(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TIPS_DISMISSED_KEY);
  } catch {}
}
