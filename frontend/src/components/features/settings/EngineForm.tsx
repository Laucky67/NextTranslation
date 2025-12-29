/**
 * 引擎配置表单组件
 * 用于创建和编辑翻译引擎配置
 */

import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Combobox } from "../../ui/combobox";
import { ApiKeyInput } from "./ApiKeyInput";
import { channelDefaults } from "../../../stores/settings";
import { CHANNEL_OPTIONS } from "../../../lib/constants";
import type { EngineFormProps } from "../../../types";

export function EngineForm({
  formData,
  setFormData,
  onChannelChange,
  showApiKey,
  onToggleApiKey,
}: EngineFormProps) {
  const currentChannelDefaults = channelDefaults[formData.channel];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>名称</Label>
        <Input
          placeholder="例如: GPT-4o, Claude 3.5..."
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>渠道类型</Label>
        <Select value={formData.channel} onValueChange={onChannelChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>API Key</Label>
        <ApiKeyInput
          value={formData.apiKey}
          onChange={(value) => setFormData((prev) => ({ ...prev, apiKey: value }))}
          showKey={showApiKey}
          onToggleShow={onToggleApiKey}
        />
      </div>

      <div className="space-y-2">
        <Label>Base URL</Label>
        <Input
          placeholder={currentChannelDefaults.baseUrl}
          value={formData.baseUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          默认: {currentChannelDefaults.baseUrl}
        </p>
      </div>

      <div className="space-y-2">
        <Label>模型</Label>
        {currentChannelDefaults.models.length > 0 ? (
          <Combobox
            options={currentChannelDefaults.models.map((m) => ({ value: m, label: m }))}
            value={formData.model}
            onChange={(v) => setFormData((prev) => ({ ...prev, model: v }))}
            placeholder="选择或输入模型名"
            allowCustom={true}
            customPlaceholder="输入自定义模型名..."
          />
        ) : (
          <Input
            placeholder="输入模型名（可选）"
            value={formData.model}
            onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
          />
        )}
        <p className="text-xs text-muted-foreground">
          可选择预设模型或输入自定义模型名
        </p>
      </div>
    </div>
  );
}
