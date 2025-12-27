/**
 * 带加载状态的按钮组件
 */

import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import type { LoadingButtonProps } from "../../types";
import { cn } from "../../lib/utils";

export function LoadingButton({
  loading = false,
  disabled = false,
  children,
  onClick,
  size = "default",
  variant = "default",
  className,
  type = "button",
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(className)}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
