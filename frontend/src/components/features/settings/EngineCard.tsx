/**
 * 引擎配置卡片组件
 * 支持显示模式和编辑模式
 */

import { Eye, EyeOff, Star, StarOff, Pencil, Check, X, Trash2 } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { EngineForm } from "./EngineForm";
import { CHANNEL_OPTIONS } from "../../../lib/constants";
import type { EngineCardProps } from "../../../types";
import { cn } from "../../../lib/utils";

export function EngineCard({
  engine,
  isDefault,
  isEditing,
  showApiKey,
  formData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleEnabled,
  onSetDefault,
  onToggleApiKey,
  setFormData,
  onChannelChange,
}: EngineCardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        !engine.enabled && "opacity-60",
        isDefault && "ring-2 ring-primary"
      )}
    >
      {isEditing && formData && setFormData && onChannelChange ? (
        // 编辑模式
        <CardContent className="pt-4 space-y-4">
          <EngineForm
            formData={formData}
            setFormData={setFormData}
            onChannelChange={onChannelChange}
            showApiKey={showApiKey}
            onToggleApiKey={onToggleApiKey}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={!formData.name.trim() || !formData.apiKey.trim()}
            >
              <Check className="h-4 w-4 mr-1" />
              保存
            </Button>
          </div>
        </CardContent>
      ) : (
        // 显示模式
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{engine.name}</span>
                {isDefault && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    默认
                  </span>
                )}
                {!engine.enabled && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    已禁用
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>
                  渠道: {CHANNEL_OPTIONS.find((c) => c.value === engine.channel)?.label}
                </p>
                <p>Base URL: {engine.baseUrl}</p>
                {engine.model && <p>模型: {engine.model}</p>}
                <p>
                  API Key: {showApiKey ? engine.apiKey : "••••••••••••"}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={onToggleApiKey}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onSetDefault}
                title={isDefault ? "取消默认" : "设为默认"}
              >
                {isDefault ? (
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleEnabled(!engine.enabled)}
                title={engine.enabled ? "禁用" : "启用"}
              >
                {engine.enabled ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                title="编辑"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                title="删除"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
