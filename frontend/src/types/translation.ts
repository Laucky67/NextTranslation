/**
 * 翻译相关类型定义
 */

import type { Language } from "./common";

export interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onSwap?: () => void;
  languages: Language[];
  showSwap?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface TranslationTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCopy?: (text: string) => void;
  showCopy?: boolean;
  readOnly?: boolean;
  minHeight?: string;
  showCharCount?: boolean;
  label?: string;
  className?: string;
}

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  engine: string;
  mode: "easy" | "vibe" | "spec";
  timestamp?: number;
}

export interface TranslationHistoryProps {
  items: TranslationHistoryItem[];
  mode?: "easy" | "vibe" | "spec";
  onDelete: (id: string) => void;
  onClear: () => void;
  maxItems?: number;
  className?: string;
}

export interface TranslationDecision {
  aspect: string;
  decision: string;
  rationale: string;
}

export interface TranslationDecisionsProps {
  decisions: TranslationDecision[];
  className?: string;
}
