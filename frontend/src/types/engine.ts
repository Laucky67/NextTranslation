/**
 * 引擎相关类型定义
 */

import type { EngineInstance, EngineChannel } from "../stores/settings";

export interface EngineSelectorProps {
  engines: EngineInstance[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface EngineMultiSelectProps {
  engines: EngineInstance[];
  selected: string[];
  onToggle: (engineId: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface EngineFormData {
  name: string;
  channel: EngineChannel;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface EngineFormProps {
  formData: EngineFormData;
  onChange: (data: EngineFormData) => void;
  showApiKey?: boolean;
  onToggleApiKey?: () => void;
  mode?: "add" | "edit";
  className?: string;
}

export interface EngineCardProps {
  engine: EngineInstance;
  isDefault?: boolean;
  showApiKey?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onSetDefault: () => void;
  onToggleApiKey: () => void;
  className?: string;
}

export interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  showKey?: boolean;
  onToggleShow?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// 重新导出以便统一导入
export type { EngineInstance, EngineChannel };
