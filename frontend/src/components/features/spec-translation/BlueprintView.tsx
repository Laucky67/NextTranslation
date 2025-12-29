/**
 * 翻译蓝图视图组件
 * 显示生成的蓝图配置和可编辑的提示词块
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import type { BlueprintViewProps } from "../../../types";
import { THEORY_DEFINITIONS } from "../../../lib/constants";

export function BlueprintView({
  blueprint,
  isStale = false,
  onBlockUpdate,
  className,
}: BlueprintViewProps) {
  const enabledTheoryLabel = (cfg: { enabled: boolean } | undefined) => {
    if (!cfg || !cfg.enabled) return "未启用";
    return "已启用";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">翻译蓝图</CardTitle>
          {isStale && (
            <span className="text-xs text-muted-foreground">
              配置已更改，建议重新生成蓝图
            </span>
          )}
        </div>
        <CardDescription>
          每块内容会被追加进发给AI的提示词；内容可编辑
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          {blueprint.theory.configs.map((cfg) => {
            const def = THEORY_DEFINITIONS.find((t) => t.id === cfg.id);
            return (
              <div key={cfg.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {def?.name || cfg.id}
                </span>
                <span>{enabledTheoryLabel(cfg)}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {blueprint.prompt_blocks?.map((block) => {
            if (!block.enabled) return null;
            return (
              <div key={block.id} className="space-y-2">
                <Label>{block.title}</Label>
                <Textarea
                  value={block.content}
                  onChange={(e) => onBlockUpdate(block.id, e.target.value)}
                  className="min-h-24"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
