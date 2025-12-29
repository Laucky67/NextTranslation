/**
 * 语言选择器组件
 * 包含源语言选择、目标语言选择和语言交换按钮
 */

import { ArrowRightLeft } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { LanguageSelectorProps } from "../../../types";
import { cn } from "../../../lib/utils";

export function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
  languages,
  showSwap = true,
  disabled = false,
  className,
}: LanguageSelectorProps) {
  const canSwap = sourceLang !== "auto" && showSwap;
  const targetLanguages = languages.filter((l) => l.code !== "auto");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={sourceLang} onValueChange={onSourceChange} disabled={disabled}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showSwap && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSwap}
          disabled={!canSwap || disabled}
          title={canSwap ? "交换语言" : "自动检测无法交换"}
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      )}

      <Select value={targetLang} onValueChange={onTargetChange} disabled={disabled}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {targetLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
