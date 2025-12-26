import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Info, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { useSettingsStore } from "../stores/settings";
import { useTranslationStore } from "../stores/translation";
import { PageHeader } from "../components/layout/PageHeader";
import {
  specGenerateBlueprint,
  specTranslate,
  type SpecTranslateRequest,
  type SpecTranslateResponse,
} from "../api/specTranslation";
import type {
  PromptBlock,
  SpecBlueprintRequest,
  SpecBlueprintResponse,
  TheoryConfig,
  TranslationBlueprint,
} from "../api/specBlueprint";

const languages = [
  { code: "auto", name: "自动检测" },
  { code: "zh", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
];

const theoryDefinitions = [
  {
    id: "equivalence" as const,
    name: "对等理论",
    englishName: "Equivalence Theory",
    description:
      "动态对等：优先确保译文对目标读者产生的影响与原文对原读者产生的影响相似",
  },
  {
    id: "functionalism" as const,
    name: "功能主义",
    englishName: "Skopos Theory",
    description: "以翻译目的为导向，根据目标读者需求调整翻译策略",
  },
  {
    id: "dts" as const,
    name: "描述翻译学",
    englishName: "Descriptive Translation Studies",
    description: "基于目标文化规范，参考已有译文，尊重译入语习惯，请注意：选择此项会显著增加token使用量",
  },
];

interface BlueprintDraftState {
  theories: {
    equivalence: { enabled: boolean };
    functionalism: { enabled: boolean; purpose: string; targetAudience: string };
    dts: { enabled: boolean; referenceSource: string; referenceTranslation: string };
  };
  methodValue: number; // 1-10
  strategyValue: number; // 1-10
  context: string;
}

const defaultDraftState: BlueprintDraftState = {
  theories: {
    equivalence: { enabled: true },
    functionalism: { enabled: false, purpose: "", targetAudience: "" },
    dts: { enabled: false, referenceSource: "", referenceTranslation: "" },
  },
  methodValue: 5,
  strategyValue: 5,
  context: "",
};

function buildTheoryConfigs(draft: BlueprintDraftState): TheoryConfig[] {
  return [
    { id: "equivalence", enabled: draft.theories.equivalence.enabled },
    {
      id: "functionalism",
      enabled: draft.theories.functionalism.enabled,
      purpose: draft.theories.functionalism.purpose.trim() || undefined,
      targetAudience: draft.theories.functionalism.targetAudience.trim() || undefined,
    },
    {
      id: "dts",
      enabled: draft.theories.dts.enabled,
      referenceSource: draft.theories.dts.referenceSource.trim() || undefined,
      referenceTranslation: draft.theories.dts.referenceTranslation.trim() || undefined,
    },
  ];
}

function buildDraftBlueprint(draft: BlueprintDraftState): TranslationBlueprint {
  const methodWeight = (draft.methodValue - 1) / 9;
  const strategyWeight = (draft.strategyValue - 1) / 9;

  return {
    theory: {
      emphasis: [],
      configs: buildTheoryConfigs(draft),
    },
    method: {
      preference:
        draft.methodValue <= 3 ? "literal" : draft.methodValue >= 7 ? "free" : "balanced",
      weight: methodWeight,
    },
    strategy: {
      approach: draft.strategyValue <= 5 ? "domestication" : "foreignization",
      weight: Math.abs(strategyWeight - 0.5) * 2,
    },
    techniques: { useTerminology: false, extractTerms: false },
    context: draft.context,
  };
}

export function SpecTranslation() {
  const { engines, defaultEngineId, getEnabledEngines } = useSettingsStore();
  const { addToHistory } = useTranslationStore();

  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("zh");
  const [selectedEngineId, setSelectedEngineId] = useState<string>(defaultEngineId || "");

  const [draft, setDraft] = useState<BlueprintDraftState>(defaultDraftState);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<TranslationBlueprint | null>(null);
  const [isBlueprintStale, setIsBlueprintStale] = useState(false);
  const [result, setResult] = useState<SpecTranslateResponse | null>(null);

  const enabledEngines = getEnabledEngines();
  const selectedEngine = engines.find((e) => e.id === selectedEngineId);
  const hasEngine = enabledEngines.length > 0;

  const resetBlueprintAndResult = () => {
    setGeneratedBlueprint(null);
    setIsBlueprintStale(false);
    setResult(null);
  };

  const markDraftChanged = () => {
    setResult(null);
    if (generatedBlueprint) setIsBlueprintStale(true);
  };

  const translateMutation = useMutation({
    mutationFn: (request: SpecTranslateRequest) => {
      if (!selectedEngine) throw new Error("请先选择翻译引擎");
      return specTranslate(request, {
        apiKey: selectedEngine.apiKey,
        baseUrl: selectedEngine.baseUrl,
        channel: selectedEngine.channel,
        model: selectedEngine.model,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      addToHistory({
        sourceText,
        translatedText: data.translated_text,
        sourceLang: data.source_lang,
        targetLang: data.target_lang,
        engine: selectedEngineId,
        mode: "spec",
      });
    },
  });

  const blueprintMutation = useMutation({
    mutationFn: (request: SpecBlueprintRequest) => {
      if (!selectedEngine) throw new Error("请先选择翻译引擎");
      return specGenerateBlueprint(request, {
        apiKey: selectedEngine.apiKey,
        baseUrl: selectedEngine.baseUrl,
        channel: selectedEngine.channel,
        model: selectedEngine.model,
      });
    },
    onSuccess: (data: SpecBlueprintResponse) => {
      setGeneratedBlueprint(data.blueprint);
      setIsBlueprintStale(false);
      setResult(null);
    },
  });

  const handleGenerateBlueprint = () => {
    if (!sourceText.trim()) return;
    const blueprint = buildDraftBlueprint(draft);
    blueprintMutation.mutate({
      text: sourceText,
      source_lang: sourceLang,
      target_lang: targetLang,
      blueprint,
    });
  };

  const handleTranslate = () => {
    if (!sourceText.trim()) return;
    if (!generatedBlueprint?.prompt_blocks?.length) return;

    translateMutation.mutate({
      text: sourceText,
      source_lang: sourceLang,
      target_lang: targetLang,
      blueprint: generatedBlueprint,
      engine: selectedEngineId,
    });
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const updatePromptBlock = (blockId: string, content: string) => {
    setGeneratedBlueprint((prev) => {
      if (!prev?.prompt_blocks) return prev;
      const nextBlocks: PromptBlock[] = prev.prompt_blocks.map((b) =>
        b.id === blockId ? { ...b, content } : b
      );
      return { ...prev, prompt_blocks: nextBlocks };
    });
  };

  const enabledTheoryLabel = (cfg: TheoryConfig | undefined) => {
    if (!cfg || !cfg.enabled) return "未启用";
    return "已启用";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="规范翻译"
        description="先生成蓝图（含 AI 建议/分析与提示词分块），确认后再开始翻译"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">源文本</CardTitle>
                <CardDescription>输入需要翻译的文本</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="请输入要翻译的文本..."
                  value={sourceText}
                  onChange={(e) => {
                    setSourceText(e.target.value);
                    resetBlueprintAndResult();
                  }}
                  className="min-h-32"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>源语言</Label>
                    <Select
                      value={sourceLang}
                      onValueChange={(v) => {
                        setSourceLang(v);
                        resetBlueprintAndResult();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择源语言" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>目标语言</Label>
                    <Select
                      value={targetLang}
                      onValueChange={(v) => {
                        setTargetLang(v);
                        resetBlueprintAndResult();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择目标语言" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages
                          .filter((lang) => lang.code !== "auto")
                          .map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">翻译引擎</CardTitle>
                <CardDescription>选择要使用的翻译引擎</CardDescription>
              </CardHeader>
              <CardContent>
                {!hasEngine ? (
                  <p className="text-sm text-muted-foreground">
                    请先在设置中配置至少一个翻译引擎
                  </p>
                ) : (
                  <Select value={selectedEngineId} onValueChange={setSelectedEngineId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择翻译引擎" />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledEngines.map((engine) => (
                        <SelectItem key={engine.id} value={engine.id}>
                          {engine.name} ({engine.channel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">翻译理论（可多选）</CardTitle>
                <CardDescription>启用的理论会参与蓝图生成与提示词分块</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Equivalence */}
                <Card className="border-muted">
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          对等理论（Equivalence Theory）
                        </CardTitle>
                        <CardDescription>{theoryDefinitions[0].description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {draft.theories.equivalence.enabled ? "已启用" : "未启用"}
                        </span>
                        <Switch
                          checked={draft.theories.equivalence.enabled}
                          onCheckedChange={(checked) => {
                            setDraft((prev) => ({
                              ...prev,
                              theories: { ...prev.theories, equivalence: { enabled: checked } },
                            }));
                            markDraftChanged();
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Functionalism */}
                <Card className="border-muted">
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          功能主义（Skopos Theory）
                        </CardTitle>
                        <CardDescription>{theoryDefinitions[1].description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {draft.theories.functionalism.enabled ? "已启用" : "未启用"}
                        </span>
                        <Switch
                          checked={draft.theories.functionalism.enabled}
                          onCheckedChange={(checked) => {
                            setDraft((prev) => ({
                              ...prev,
                              theories: {
                                ...prev.theories,
                                functionalism: { ...prev.theories.functionalism, enabled: checked },
                              },
                            }));
                            markDraftChanged();
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  {draft.theories.functionalism.enabled && (
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>翻译目的</Label>
                        <Input
                          value={draft.theories.functionalism.purpose}
                          placeholder="例如：用于技术文档、学术发表、商业宣传..."
                          onChange={(e) => {
                            setDraft((prev) => ({
                              ...prev,
                              theories: {
                                ...prev.theories,
                                functionalism: {
                                  ...prev.theories.functionalism,
                                  purpose: e.target.value,
                                },
                              },
                            }));
                            markDraftChanged();
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>目标读者</Label>
                        <Input
                          value={draft.theories.functionalism.targetAudience}
                          placeholder="例如：开发者、普通大众、儿童..."
                          onChange={(e) => {
                            setDraft((prev) => ({
                              ...prev,
                              theories: {
                                ...prev.theories,
                                functionalism: {
                                  ...prev.theories.functionalism,
                                  targetAudience: e.target.value,
                                },
                              },
                            }));
                            markDraftChanged();
                          }}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* DTS */}
                <Card className="border-muted">
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base">描述翻译学（DTS）</CardTitle>
                        <CardDescription>{theoryDefinitions[2].description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {draft.theories.dts.enabled ? "已启用" : "未启用"}
                        </span>
                        <Switch
                          checked={draft.theories.dts.enabled}
                          onCheckedChange={(checked) => {
                            setDraft((prev) => ({
                              ...prev,
                              theories: {
                                ...prev.theories,
                                dts: { ...prev.theories.dts, enabled: checked },
                              },
                            }));
                            markDraftChanged();
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  {draft.theories.dts.enabled && (
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>参考原文</Label>
                        <Textarea
                          value={draft.theories.dts.referenceSource}
                          placeholder="粘贴类似风格的原文示例..."
                          onChange={(e) => {
                            setDraft((prev) => ({
                              ...prev,
                              theories: {
                                ...prev.theories,
                                dts: { ...prev.theories.dts, referenceSource: e.target.value },
                              },
                            }));
                            markDraftChanged();
                          }}
                          className="min-h-20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>参考译文</Label>
                        <Textarea
                          value={draft.theories.dts.referenceTranslation}
                          placeholder="粘贴对应的译文示例..."
                          onChange={(e) => {
                            setDraft((prev) => ({
                              ...prev,
                              theories: {
                                ...prev.theories,
                                dts: {
                                  ...prev.theories.dts,
                                  referenceTranslation: e.target.value,
                                },
                              },
                            }));
                            markDraftChanged();
                          }}
                          className="min-h-20"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">翻译方法与策略</CardTitle>
                <CardDescription>生成蓝图后可在分块中进一步微调</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>翻译方法</Label>
                    <span className="text-sm text-muted-foreground">
                      {draft.methodValue <= 3 ? "偏直译" : draft.methodValue >= 7 ? "偏意译" : "平衡"}（{draft.methodValue}/10）
                    </span>
                  </div>
                  <Slider
                    value={[draft.methodValue]}
                    onValueChange={([value]) => {
                      setDraft((prev) => ({ ...prev, methodValue: value }));
                      markDraftChanged();
                    }}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>翻译策略</Label>
                    <span className="text-sm text-muted-foreground">
                      {draft.strategyValue <= 3
                        ? "偏归化"
                        : draft.strategyValue >= 7
                        ? "偏异化"
                        : "中立"}（{draft.strategyValue}/10）
                    </span>
                  </div>
                  <Slider
                    value={[draft.strategyValue]}
                    onValueChange={([value]) => {
                      setDraft((prev) => ({ ...prev, strategyValue: value }));
                      markDraftChanged();
                    }}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>额外上下文</Label>
                  <Textarea
                    placeholder="补充领域背景、受众场景、术语约束等..."
                    value={draft.context}
                    onChange={(e) => {
                      setDraft((prev) => ({ ...prev, context: e.target.value }));
                      markDraftChanged();
                    }}
                    className="min-h-20"
                  />
                </div>
              </CardContent>
            </Card>

            {!generatedBlueprint ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerateBlueprint}
                disabled={
                  !sourceText.trim() ||
                  !hasEngine ||
                  !selectedEngineId ||
                  blueprintMutation.isPending
                }
              >
                {blueprintMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成蓝图中...
                  </>
                ) : (
                  "生成蓝图"
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleGenerateBlueprint}
                disabled={
                  !sourceText.trim() ||
                  !hasEngine ||
                  !selectedEngineId ||
                  blueprintMutation.isPending ||
                  translateMutation.isPending
                }
              >
                {blueprintMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  "重新生成蓝图"
                )}
              </Button>
            )}
        </div>

        {/* Results */}
        <div className="space-y-4">
            {(blueprintMutation.isError || translateMutation.isError) && (
              <Card className="border-destructive">
                <CardContent className="pt-4">
                  <p className="text-destructive text-sm">
                    {blueprintMutation.isError
                      ? `蓝图生成失败: ${
                          blueprintMutation.error instanceof Error
                            ? blueprintMutation.error.message
                            : "未知错误"
                        }`
                      : `翻译失败: ${
                          translateMutation.error instanceof Error
                            ? translateMutation.error.message
                            : "未知错误"
                        }`}
                  </p>
                </CardContent>
              </Card>
            )}

            {!generatedBlueprint && !blueprintMutation.isPending && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <div className="space-y-2">
                    <p>蓝图将显示在这里</p>
                    <p className="text-sm">配置好理论、方法和策略后点击“生成蓝图”</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedBlueprint && (
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">翻译蓝图</CardTitle>
                      {isBlueprintStale && (
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
                      {generatedBlueprint.theory.configs.map((cfg) => {
                        const def = theoryDefinitions.find((t) => t.id === cfg.id);
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
                      {generatedBlueprint.prompt_blocks?.map((block) => {
                        if (!block.enabled) return null;
                        return (
                          <div key={block.id} className="space-y-2">
                            <Label>{block.title}</Label>
                            <Textarea
                              value={block.content}
                              onChange={(e) => updatePromptBlock(block.id, e.target.value)}
                              className="min-h-24"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleTranslate}
                  disabled={
                    !sourceText.trim() ||
                    !hasEngine ||
                    !selectedEngineId ||
                    translateMutation.isPending ||
                    !generatedBlueprint?.prompt_blocks?.length
                  }
                >
                  {translateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      翻译中...
                    </>
                  ) : (
                    result ? "重新翻译" : "开始翻译"
                  )}
                </Button>
              </div>
            )}

            {result && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">翻译结果</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="whitespace-pre-wrap">{result.translated_text}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(result.translated_text)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {result.decisions && result.decisions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4" />
                        <CardTitle className="text-base">翻译决策说明</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.decisions.map((decision, index) => (
                          <div
                            key={index}
                            className="p-2 rounded-md bg-muted/30 text-sm"
                          >
                            <div className="font-medium">{decision.aspect}</div>
                            <div className="text-muted-foreground">
                              {decision.decision} - {decision.rationale}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
