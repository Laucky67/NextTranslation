/**
 * 翻译文本区域组件
 * 集成文本输入、字符计数和复制功能
 */

import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { CopyButton } from "../../common";
import type { TranslationTextAreaProps } from "../../../types";
import { cn } from "../../../lib/utils";

export function TranslationTextArea({
  value,
  onChange,
  placeholder = "输入文本...",
  onCopy,
  showCopy = true,
  readOnly = false,
  minHeight = "150px",
  showCharCount = true,
  label,
  className,
}: TranslationTextAreaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!readOnly) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        className={cn("resize-none", readOnly && "bg-muted/50")}
        style={{ minHeight }}
      />

      {(showCharCount || showCopy) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {showCharCount && <span>{value.length} 字符</span>}
          {showCopy && onCopy && <CopyButton text={value} />}
        </div>
      )}
    </div>
  );
}
