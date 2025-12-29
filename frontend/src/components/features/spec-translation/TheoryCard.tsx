/**
 * 翻译理论选择卡片组件
 * 支持对等理论、功能主义、描述翻译学三种理论
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";
import type { TheoryCardProps } from "../../../types";

export function TheoryCard({
  id,
  title,
  description,
  enabled,
  onToggle,
  purpose,
  targetAudience,
  onPurposeChange,
  onTargetAudienceChange,
  referenceSource,
  referenceTranslation,
  onReferenceSourceChange,
  onReferenceTranslationChange,
}: TheoryCardProps) {
  return (
    <Card className="border-muted">
      <CardHeader className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {enabled ? "已启用" : "未启用"}
            </span>
            <Switch checked={enabled} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardHeader>

      {enabled && id === "functionalism" && (
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>翻译目的</Label>
            <Input
              value={purpose || ""}
              placeholder="例如：用于技术文档、学术发表、商业宣传..."
              onChange={(e) => onPurposeChange?.(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>目标读者</Label>
            <Input
              value={targetAudience || ""}
              placeholder="例如：开发者、普通大众、儿童..."
              onChange={(e) => onTargetAudienceChange?.(e.target.value)}
            />
          </div>
        </CardContent>
      )}

      {enabled && id === "dts" && (
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>参考原文</Label>
            <Textarea
              value={referenceSource || ""}
              placeholder="粘贴类似风格的原文示例..."
              onChange={(e) => onReferenceSourceChange?.(e.target.value)}
              className="min-h-20"
            />
          </div>
          <div className="space-y-2">
            <Label>参考译文</Label>
            <Textarea
              value={referenceTranslation || ""}
              placeholder="粘贴对应的译文示例..."
              onChange={(e) => onReferenceTranslationChange?.(e.target.value)}
              className="min-h-20"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
