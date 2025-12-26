import { apiClient, API_BASE_URL, type EngineConfig } from "./client";

// 类型定义
export interface EasyTranslateRequest {
  text: string;
  source_lang: string;
  target_lang: string;
  prompt?: string;
  engine?: string;
}

export interface EasyTranslateResponse {
  translated_text: string;
  source_lang: string;
  target_lang: string;
  engine: string;
}

export interface VibeTranslateRequest {
  text: string;
  source_lang: string;
  target_lang: string;
  intent: string;
  engines: string[];
}

export interface TranslationScore {
  accuracy: number;
  fluency: number;
  style_match: number;
  terminology: number;
  overall: number;
  comment?: string;
}

export interface ScoredEngineResult {
  engine_id: string;
  engine_name: string;
  translated_text: string;
  success: boolean;
  error?: string;
  score?: TranslationScore;
}

export interface VibeTranslateResponse {
  source_lang: string;
  target_lang: string;
  intent: string;
  results: ScoredEngineResult[];
  best_result?: ScoredEngineResult;
  synthesized_translation?: string;
  synthesis_rationale?: string;
}

// 扩展的翻译蓝图，支持多理论配置
export interface TranslationBlueprint {
  theory: {
    primary: string;
    emphasis: string[];
    configs?: Array<{
      id: string;
      prompt?: string;
      [key: string]: unknown;
    }>;
  };
  method: {
    preference: "literal" | "free" | "balanced" | "adaptation";
    weight: number;
  };
  strategy: {
    approach: "domestication" | "foreignization";
    weight: number;
  };
  techniques: {
    useTerminology: boolean;
    terminologySource?: string;
    extractTerms: boolean;
  };
  context: string;
}

export interface SpecTranslateRequest {
  text: string;
  source_lang: string;
  target_lang: string;
  blueprint: TranslationBlueprint;
  engine?: string;
}

export interface TranslationDecision {
  aspect: string;
  decision: string;
  rationale: string;
}

export interface SpecTranslateResponse {
  translated_text: string;
  source_lang: string;
  target_lang: string;
  blueprint_applied: TranslationBlueprint;
  decisions?: TranslationDecision[];
  extracted_terms?: Record<string, string>[];
}

export interface EngineInfo {
  id: string;
  name: string;
  type: string;
  supported_languages: string[];
  requires_key: string;
}

// API 函数 - 新版：使用引擎配置
export async function easyTranslate(
  request: EasyTranslateRequest,
  engineConfig: EngineConfig
): Promise<EasyTranslateResponse> {
  return apiClient.post("/api/translate/easy", request, { engineConfig });
}

export async function vibeTranslate(
  request: VibeTranslateRequest,
  engineConfigs: EngineConfig[]
): Promise<VibeTranslateResponse> {
  return apiClient.post("/api/translate/vibe", request, { engineConfigs });
}

export async function vibeTranslateStream(
  request: VibeTranslateRequest,
  engineConfigs: EngineConfig[],
  judgeConfig?: EngineConfig,
  handlers: {
    onPartial?: (result: ScoredEngineResult) => void;
    onFinal?: (final: VibeTranslateResponse) => void;
  } = {}
): Promise<VibeTranslateResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Engine-Configs": JSON.stringify(engineConfigs),
  };
  if (judgeConfig) {
    headers["X-Judge-Engine-Config"] = JSON.stringify(judgeConfig);
  }

  const res = await fetch(`${API_BASE_URL}/api/translate/vibe/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      (err?.error?.message as string | undefined) ||
      (err?.detail as string | undefined) ||
      `HTTP error! status: ${res.status}`;
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("浏览器不支持流式读取");
  }

  let buffer = "";
  let finalResponse: VibeTranslateResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += new TextDecoder("utf-8").decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const lines = part.split("\n");
      let event = "";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      if (!event || !data) continue;

      if (event === "partial") {
        const parsed = JSON.parse(data) as ScoredEngineResult;
        handlers.onPartial?.(parsed);
      } else if (event === "final") {
        const parsed = JSON.parse(data) as VibeTranslateResponse;
        finalResponse = parsed;
        handlers.onFinal?.(parsed);
      }
    }
  }

  if (!finalResponse) {
    throw new Error("未收到最终翻译结果");
  }
  return finalResponse;
}

export async function specTranslate(
  request: SpecTranslateRequest,
  engineConfig: EngineConfig
): Promise<SpecTranslateResponse> {
  return apiClient.post("/api/translate/spec", request, { engineConfig });
}

export async function getEngines(): Promise<{ engines: EngineInfo[] }> {
  return apiClient.get("/api/engines");
}

export async function healthCheck(): Promise<{ status: string; service: string }> {
  return apiClient.get("/health");
}

// 重新导出 EngineConfig 类型
export type { EngineConfig };
