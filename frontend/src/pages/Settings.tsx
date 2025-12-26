import { useState } from "react";
import { Eye, EyeOff, Plus, Trash2, Star, StarOff, Pencil, Check, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  useSettingsStore,
  channelDefaults,
  type EngineChannel,
  type EngineInstance,
} from "../stores/settings";
import { cn } from "../lib/utils";

const channelOptions: { value: EngineChannel; label: string; description: string }[] = [
  { value: "openai", label: "OpenAI 兼容", description: "支持 OpenAI API 格式的服务" },
  { value: "anthropic", label: "Anthropic 兼容", description: "支持 Anthropic API 格式的服务" },
  { value: "google", label: "Google 翻译", description: "Google Cloud Translation API" },
  { value: "deepl", label: "DeepL", description: "DeepL 翻译 API" },
];

interface EngineFormData {
  name: string;
  channel: EngineChannel;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const defaultFormData: EngineFormData = {
  name: "",
  channel: "openai",
  apiKey: "",
  baseUrl: channelDefaults.openai.baseUrl,
  model: channelDefaults.openai.models[0] || "",
};

export function Settings() {
  const {
    engines,
    defaultEngineId,
    addEngine,
    updateEngine,
    removeEngine,
    setDefaultEngine,
  } = useSettingsStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EngineFormData>(defaultFormData);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const toggleShowApiKey = (id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleChannelChange = (channel: EngineChannel) => {
    const defaults = channelDefaults[channel];
    setFormData((prev) => ({
      ...prev,
      channel,
      baseUrl: defaults.baseUrl,
      model: defaults.models[0] || "",
    }));
  };

  const handleAddEngine = () => {
    if (!formData.name.trim() || !formData.apiKey.trim()) return;

    addEngine({
      name: formData.name,
      channel: formData.channel,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      model: formData.model || undefined,
      enabled: true,
    });

    setFormData(defaultFormData);
    setShowAddForm(false);
  };

  const handleStartEdit = (engine: EngineInstance) => {
    setEditingId(engine.id);
    setFormData({
      name: engine.name,
      channel: engine.channel,
      apiKey: engine.apiKey,
      baseUrl: engine.baseUrl,
      model: engine.model || "",
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!formData.name.trim() || !formData.apiKey.trim()) return;

    updateEngine(id, {
      name: formData.name,
      channel: formData.channel,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      model: formData.model || undefined,
    });

    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateEngine(id, { enabled });
  };

  const handleSetDefault = (id: string) => {
    setDefaultEngine(id === defaultEngineId ? null : id);
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个引擎配置吗？")) {
      removeEngine(id);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground">管理翻译引擎配置和偏好设置</p>
      </div>

      {/* Engines List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>翻译引擎</CardTitle>
              <CardDescription>
                配置多个翻译引擎实例，每个引擎可以有独立的 API 密钥和配置
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setShowAddForm(true);
                setFormData(defaultFormData);
              }}
              disabled={showAddForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加引擎
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Engine Form */}
          {showAddForm && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">新建引擎配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EngineForm
                  formData={formData}
                  setFormData={setFormData}
                  onChannelChange={handleChannelChange}
                  showApiKey={showApiKeys["new"]}
                  onToggleApiKey={() => toggleShowApiKey("new")}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData(defaultFormData);
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleAddEngine}
                    disabled={!formData.name.trim() || !formData.apiKey.trim()}
                  >
                    添加
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Engine List */}
          {engines.length === 0 && !showAddForm ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>还没有配置任何翻译引擎</p>
              <p className="text-sm">点击上方"添加引擎"按钮开始配置</p>
            </div>
          ) : (
            <div className="space-y-3">
              {engines.map((engine) => (
                <Card
                  key={engine.id}
                  className={cn(
                    "transition-colors",
                    !engine.enabled && "opacity-60",
                    engine.id === defaultEngineId && "ring-2 ring-primary"
                  )}
                >
                  {editingId === engine.id ? (
                    // Edit Mode
                    <CardContent className="pt-4 space-y-4">
                      <EngineForm
                        formData={formData}
                        setFormData={setFormData}
                        onChannelChange={handleChannelChange}
                        showApiKey={showApiKeys[engine.id]}
                        onToggleApiKey={() => toggleShowApiKey(engine.id)}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-1" />
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(engine.id)}
                          disabled={!formData.name.trim() || !formData.apiKey.trim()}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          保存
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    // View Mode
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{engine.name}</span>
                            {engine.id === defaultEngineId && (
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
                              渠道: {channelOptions.find((c) => c.value === engine.channel)?.label}
                            </p>
                            <p>Base URL: {engine.baseUrl}</p>
                            {engine.model && <p>模型: {engine.model}</p>}
                            <p>
                              API Key: {showApiKeys[engine.id] ? engine.apiKey : "••••••••••••"}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1"
                                onClick={() => toggleShowApiKey(engine.id)}
                              >
                                {showApiKeys[engine.id] ? (
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
                            onClick={() => handleSetDefault(engine.id)}
                            title={engine.id === defaultEngineId ? "取消默认" : "设为默认"}
                          >
                            {engine.id === defaultEngineId ? (
                              <Star className="h-4 w-4 fill-current text-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleEnabled(engine.id, !engine.enabled)}
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
                            onClick={() => handleStartEdit(engine)}
                            title="编辑"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(engine.id)}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">关于密钥存储</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            所有 API 密钥仅存储在您的本地浏览器中，不会上传到任何服务器。
            翻译请求将直接从您的浏览器发送到相应的 API 服务。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Engine Form Component
function EngineForm({
  formData,
  setFormData,
  onChannelChange,
  showApiKey,
  onToggleApiKey,
}: {
  formData: EngineFormData;
  setFormData: React.Dispatch<React.SetStateAction<EngineFormData>>;
  onChannelChange: (channel: EngineChannel) => void;
  showApiKey: boolean;
  onToggleApiKey: () => void;
}) {
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
            {channelOptions.map((option) => (
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
        <div className="relative">
          <Input
            type={showApiKey ? "text" : "password"}
            placeholder="输入 API 密钥..."
            value={formData.apiKey}
            onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={onToggleApiKey}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
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
        <Label>模型（可选）</Label>
        {currentChannelDefaults.models.length > 0 ? (
          <Select
            value={formData.model}
            onValueChange={(v) => setFormData((prev) => ({ ...prev, model: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              {currentChannelDefaults.models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="此渠道无需指定模型"
            value={formData.model}
            onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
            disabled={currentChannelDefaults.models.length === 0}
          />
        )}
      </div>
    </div>
  );
}
