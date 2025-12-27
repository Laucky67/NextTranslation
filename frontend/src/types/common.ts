/**
 * 通用类型定义
 */

export interface Language {
  code: string;
  name: string;
}

export type TranslationMode = "easy" | "vibe" | "spec";

export interface CopyButtonProps {
  text: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
  className?: string;
}

export interface LoadingButtonProps {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  type?: "button" | "submit" | "reset";
}

export interface ErrorAlertProps {
  error: Error | string | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export interface WarningAlertProps {
  message: string;
  type?: "warning" | "info";
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}
