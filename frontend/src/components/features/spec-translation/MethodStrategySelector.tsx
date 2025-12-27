/**
 * 翻译方法与策略选择器组件
 * 包含翻译方法滑块、翻译策略滑块和额外上下文输入
 */

import { Label } from "../../ui/label";
import { Slider } from "../../ui/slider";
import { Textarea } from "../../ui/textarea";
import type { MethodStrategySelectorProps } from "../../../types";

export function MethodStrategySelector({
  methodValue,
  strategyValue,
  context,
  onMethodChange,
  onStrategyChange,
  onContextChange,
  disabled = false,
}: MethodStrategySelectorProps) {
  const getMethodLabel = (value: number) => {
    if (value <= 3) return "偏直译";
    if (value >= 7) return "偏意译";
    return "平衡";
  };

  const getStrategyLabel = (value: number) => {
    if (value <= 3) return "偏归化";
    if (value >= 7) return "偏异化";
    return "中立";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>翻译方法</Label>
          <span className="text-sm text-muted-foreground">
            {getMethodLabel(methodValue)}（{methodValue}/10）
          </span>
        </div>
        <Slider
          value={[methodValue]}
          onValueChange={([value]) => onMethodChange(value)}
          min={1}
          max={10}
          step={1}
          disabled={disabled}
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>翻译策略</Label>
          <span className="text-sm text-muted-foreground">
            {getStrategyLabel(strategyValue)}（{strategyValue}/10）
          </span>
        </div>
        <Slider
          value={[strategyValue]}
          onValueChange={([value]) => onStrategyChange(value)}
          min={1}
          max={10}
          step={1}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>额外上下文</Label>
        <Textarea
          placeholder="补充领域背景、受众场景、术语约束等..."
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          className="min-h-20"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
