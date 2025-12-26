export type PromptBlockId =
  | "theory.equivalence"
  | "theory.functionalism"
  | "theory.dts"
  | "method"
  | "strategy"
  | "context";

export interface PromptBlock {
  id: PromptBlockId;
  enabled: boolean;
  title: string;
  content: string;
  sources?: string[];
}

export type TheoryId = "equivalence" | "functionalism" | "dts";

export type TheoryConfig =
  | {
      id: "equivalence";
      enabled: boolean;
      definition?: string;
      ai_suggestion?: string;
      equivalenceType?: "formal" | "dynamic";
    }
  | {
      id: "functionalism";
      enabled: boolean;
      purpose?: string;
      targetAudience?: string;
    }
  | {
      id: "dts";
      enabled: boolean;
      referenceSource?: string;
      referenceTranslation?: string;
      ai_analysis?: string;
    };

export interface TranslationBlueprint {
  theory: {
    primary?: TheoryId;
    emphasis: string[];
    configs: TheoryConfig[];
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
  prompt_blocks?: PromptBlock[];
}

export interface SpecBlueprintRequest {
  text: string;
  source_lang: string;
  target_lang: string;
  blueprint: TranslationBlueprint;
}

export interface SpecBlueprintResponse {
  blueprint: TranslationBlueprint;
}

