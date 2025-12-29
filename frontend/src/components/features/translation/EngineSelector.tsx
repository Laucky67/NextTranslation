/**
 * 引擎选择器组件（单选下拉）
 * 用于选择单个翻译引擎
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { EngineSelectorProps } from "../../../types";
import { cn } from "../../../lib/utils";

export function EngineSelector({
  engines,
  value,
  onChange,
  placeholder = "选择引擎",
  disabled = false,
  className,
}: EngineSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn(className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {engines.map((engine) => (
          <SelectItem key={engine.id} value={engine.id}>
            {engine.name}
            {engine.model && ` (${engine.model})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
