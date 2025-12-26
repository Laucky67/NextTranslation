import { apiClient, type EngineConfig } from "./client";
import type { SpecBlueprintRequest, SpecBlueprintResponse, TranslationBlueprint } from "./specBlueprint";

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

export async function specTranslate(
  request: SpecTranslateRequest,
  engineConfig: EngineConfig
): Promise<SpecTranslateResponse> {
  return apiClient.post("/api/translate/spec", request, { engineConfig });
}

export async function specGenerateBlueprint(
  request: SpecBlueprintRequest,
  engineConfig: EngineConfig
): Promise<SpecBlueprintResponse> {
  return apiClient.post("/api/translate/spec/blueprint", request, { engineConfig });
}

