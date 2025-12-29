/**
 * API密钥输入框组件
 * 支持显示/隐藏密钥功能
 */

import { Eye, EyeOff } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import type { ApiKeyInputProps } from "../../../types";
import { cn } from "../../../lib/utils";

export function ApiKeyInput({
  value,
  onChange,
  showKey = false,
  onToggleShow,
  placeholder = "输入 API 密钥...",
  className,
}: ApiKeyInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Input
        type={showKey ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {onToggleShow && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3"
          onClick={onToggleShow}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
