/**
 * 规范翻译（Spec Translation）相关类型定义
 */

import type { TranslationBlueprint } from "../api/specBlueprint";
import type { TranslationDecision } from "./translation";

export interface BlueprintDraftState {
  theories: {
    equivalence: { enabled: boolean };
    functionalism: { enabled: boolean; purpose: string; targetAudience: string };
    dts: { enabled: boolean; referenceSource: string; referenceTranslation: string };
  };
  methodValue: number; // 1-10
  strategyValue: number; // 1-10
  context: string;
}

export interface TheoryCardProps {
  id: "equivalence" | "functionalism" | "dts";
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  // 功能主义专用字段
  purpose?: string;
  targetAudience?: string;
  onPurposeChange?: (value: string) => void;
  onTargetAudienceChange?: (value: string) => void;
  // 描述翻译学专用字段
  referenceSource?: string;
  referenceTranslation?: string;
  onReferenceSourceChange?: (value: string) => void;
  onReferenceTranslationChange?: (value: string) => void;
}

export interface MethodStrategySelectorProps {
  methodValue: number;
  strategyValue: number;
  context: string;
  onMethodChange: (value: number) => void;
  onStrategyChange: (value: number) => void;
  onContextChange: (value: string) => void;
  disabled?: boolean;
}

export interface BlueprintViewProps {
  blueprint: TranslationBlueprint;
  isStale?: boolean;
  onBlockUpdate: (blockId: string, content: string) => void;
  className?: string;
}

export interface DecisionListProps {
  decisions: TranslationDecision[];
  className?: string;
}
