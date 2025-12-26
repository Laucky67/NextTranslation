const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// 引擎配置接口
export interface EngineConfig {
  apiKey: string;
  baseUrl: string;
  channel: "openai" | "anthropic" | "google" | "deepl";
  model?: string;
}

interface RequestOptions extends RequestInit {
  // 旧版：固定的 API 密钥对象
  apiKeys?: {
    openai?: string;
    anthropic?: string;
    google?: string;
    deepl?: string;
  };
  // 新版：引擎配置
  engineConfig?: EngineConfig;
  // 多引擎配置（用于 vibe 模式）
  engineConfigs?: EngineConfig[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildHeaders(options?: RequestOptions): Headers {
    const headers = new Headers(options?.headers);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // 新版：单个引擎配置
    if (options?.engineConfig) {
      headers.set("X-Engine-Config", JSON.stringify(options.engineConfig));
    }

    // 新版：多引擎配置
    if (options?.engineConfigs) {
      headers.set("X-Engine-Configs", JSON.stringify(options.engineConfigs));
    }

    // 旧版兼容：添加 API 密钥头
    if (options?.apiKeys) {
      if (options.apiKeys.openai) {
        headers.set("X-OpenAI-Key", options.apiKeys.openai);
      }
      if (options.apiKeys.anthropic) {
        headers.set("X-Anthropic-Key", options.apiKeys.anthropic);
      }
      if (options.apiKeys.google) {
        headers.set("X-Google-Key", options.apiKeys.google);
      }
      if (options.apiKeys.deepl) {
        headers.set("X-DeepL-Key", options.apiKeys.deepl);
      }
    }

    return headers;
  }

  async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(options);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
