import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

// 引擎渠道类型
export type EngineChannel = "openai" | "anthropic";

// 单个引擎实例配置
export interface EngineInstance {
  id: string;
  name: string;
  channel: EngineChannel;
  apiKey: string;
  baseUrl: string;
  model?: string;
  enabled: boolean;
}

interface SettingsState {
  theme: Theme;
  engines: EngineInstance[];
  defaultEngineId: string | null;

  // 主题操作
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // 引擎操作
  addEngine: (engine: Omit<EngineInstance, "id">) => string;
  updateEngine: (id: string, updates: Partial<Omit<EngineInstance, "id">>) => void;
  removeEngine: (id: string) => void;
  setDefaultEngine: (id: string | null) => void;
  getEngine: (id: string) => EngineInstance | undefined;
  getEnabledEngines: () => EngineInstance[];
}

// 生成唯一 ID
function generateId(): string {
  return `engine_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "light",
      engines: [],
      defaultEngineId: null,

      toggleTheme: () => {
        const newTheme = get().theme === "light" ? "dark" : "light";
        set({ theme: newTheme });
        updateDocumentTheme(newTheme);
      },

      setTheme: (theme) => {
        set({ theme });
        updateDocumentTheme(theme);
      },

      addEngine: (engine) => {
        const id = generateId();
        const newEngine: EngineInstance = { ...engine, id };
        set((state) => {
          const engines = [...state.engines, newEngine];
          // 如果是第一个引擎，设为默认
          const defaultEngineId = state.defaultEngineId || id;
          return { engines, defaultEngineId };
        });
        return id;
      },

      updateEngine: (id, updates) => {
        set((state) => ({
          engines: state.engines.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      removeEngine: (id) => {
        set((state) => {
          const engines = state.engines.filter((e) => e.id !== id);
          // 如果删除的是默认引擎，重新选择
          let defaultEngineId = state.defaultEngineId;
          if (defaultEngineId === id) {
            defaultEngineId = engines.find((e) => e.enabled)?.id || null;
          }
          return { engines, defaultEngineId };
        });
      },

      setDefaultEngine: (id) => {
        set({ defaultEngineId: id });
      },

      getEngine: (id) => {
        return get().engines.find((e) => e.id === id);
      },

      getEnabledEngines: () => {
        return get().engines.filter((e) => e.enabled);
      },
    }),
    {
      name: "nexttranslation-settings",
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          updateDocumentTheme(state.theme);
        }
      },
    }
  )
);

function updateDocumentTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }
}

// 初始化时检测系统主题偏好
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("nexttranslation-settings");
  if (!stored) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    useSettingsStore.getState().setTheme(prefersDark ? "dark" : "light");
  }
}

// 渠道默认配置
export const channelDefaults: Record<EngineChannel, { baseUrl: string; models: string[] }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com",
    models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  },
};
