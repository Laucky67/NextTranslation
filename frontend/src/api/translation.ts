import { apiClient, type EngineConfig } from "./client";

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
