import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useSettingsStore, channelDefaults, type EngineChannel } from "../stores/settings";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState, ConfirmDialog } from "../components/common";
import { EngineForm, EngineCard } from "../components/features/settings";
import type { EngineFormData } from "../types";

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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    engineId: string | null;
  }>({ open: false, engineId: null });

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

  const handleStartEdit = (engineId: string) => {
    const engine = engines.find((e) => e.id === engineId);
    if (!engine) return;

    setEditingId(engineId);
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

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, engineId: id });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.engineId) {
      removeEngine(deleteConfirm.engineId);
    }
    setDeleteConfirm({ open: false, engineId: null });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, engineId: null });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="设置" description="管理翻译引擎配置和偏好设置" />

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
            <EmptyState
              title="还没有配置任何翻译引擎"
              description="点击上方「添加引擎」按钮开始配置"
            />
          ) : (
            <div className="space-y-3">
              {engines.map((engine) => (
                <EngineCard
                  key={engine.id}
                  engine={engine}
                  isDefault={engine.id === defaultEngineId}
                  isEditing={editingId === engine.id}
                  showApiKey={showApiKeys[engine.id] || false}
                  formData={editingId === engine.id ? formData : undefined}
                  onEdit={() => handleStartEdit(engine.id)}
                  onSave={() => handleSaveEdit(engine.id)}
                  onCancel={handleCancelEdit}
                  onDelete={() => handleDeleteClick(engine.id)}
                  onToggleEnabled={(enabled) => handleToggleEnabled(engine.id, enabled)}
                  onSetDefault={() => handleSetDefault(engine.id)}
                  onToggleApiKey={() => toggleShowApiKey(engine.id)}
                  setFormData={editingId === engine.id ? setFormData : undefined}
                  onChannelChange={editingId === engine.id ? handleChannelChange : undefined}
                />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="确认删除"
        message="确定要删除这个引擎配置吗？"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="删除"
        cancelText="取消"
      />
    </div>
  );
}
