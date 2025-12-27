/**
 * 引擎多选器组件（按钮组）
 * 用于选择多个翻译引擎进行并行翻译
 */

import { Button } from "../../ui/button";
import type { EngineMultiSelectProps } from "../../../types";
import { cn } from "../../../lib/utils";

export function EngineMultiSelect({
  engines,
  selected,
  onToggle,
  disabled = false,
  className,
}: EngineMultiSelectProps) {
  const isSelected = (engineId: string) => selected.includes(engineId);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {engines.map((engine) => (
        <Button
          key={engine.id}
          variant={isSelected(engine.id) ? "default" : "outline"}
          size="sm"
          onClick={() => onToggle(engine.id)}
          disabled={disabled}
        >
          {engine.name}
          {engine.model && ` (${engine.model})`}
        </Button>
      ))}
    </div>
  );
}
