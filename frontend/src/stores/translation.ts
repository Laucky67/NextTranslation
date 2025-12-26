import { create } from "zustand";

interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  engine: string;
  timestamp: number;
  mode: "easy" | "vibe" | "spec";
}

interface TranslationState {
  history: TranslationHistoryItem[];
  addToHistory: (item: Omit<TranslationHistoryItem, "id" | "timestamp">) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
}

export const useTranslationStore = create<TranslationState>()((set) => ({
  history: [],

  addToHistory: (item) => {
    const newItem: TranslationHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => ({
      history: [newItem, ...state.history].slice(0, 50), // 最多保留50条
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },

  removeFromHistory: (id) => {
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    }));
  },
}));
