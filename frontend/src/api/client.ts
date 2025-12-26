export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// 引擎配置接口
export interface EngineConfig {
  apiKey: string;
  baseUrl: string;
  channel: "openai" | "anthropic";
  model?: string;
}

interface RequestOptions extends RequestInit {
  engineConfig?: EngineConfig;
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
      throw new Error(extractErrorMessage(error, response.status));
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

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const maybeRecord = payload as Record<string, unknown>;
    const apiError = maybeRecord.error;
    if (apiError && typeof apiError === "object") {
      const apiErrorRecord = apiError as Record<string, unknown>;
      const message = apiErrorRecord.message;
      if (typeof message === "string" && message.trim()) return message;
    }
    const detail = maybeRecord.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return `HTTP error! status: ${status}`;
}
