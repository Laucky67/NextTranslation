import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
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
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { useSettingsStore } from "../stores/settings";
import { useTranslationStore } from "../stores/translation";
import {
  specTranslate,
  type SpecTranslateRequest,
  type SpecTranslateResponse,
} from "../api/translation";
import { cn } from "../lib/utils";

const languages = [
  { code: "auto", name: "自动检测" },
  { code: "zh", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
];

// 翻译理论配置
interface TheoryConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  promptPlaceholder: string;
  extraFields?: {
    type: "text" | "textarea";
    key: string;
    label: string;
    placeholder: string;
  }[];
}

const theoryDefinitions: Omit<TheoryConfig, "enabled">[] = [
  {
    id: "equivalence",
    name: "对等理论 (Equivalence Theory)",
    description: "追求语义等值，优先传达原文的核心含义，保持信息对等",
    promptPlaceholder: "例如：注重形式对等还是动态对等...",
  },
  {
    id: "functionalism",
    name: "功能主义 (Skopos Theory)",
    description: "以翻译目的为导向，根据目标读者需求调整翻译策略",
    promptPlaceholder: "例如：翻译目的是...",
    extraFields: [
      {
        type: "text",
        key: "purpose",
        label: "翻译目的",
        placeholder: "例如：用于学术发表、商业宣传、日常交流...",
      },
      {
        type: "text",
        key: "targetAudience",
        label: "目标读者",
        placeholder: "例如：专业人士、普通大众、儿童...",
      },
    ],
  },
  {
    id: "dts",
    name: "描述翻译学 (DTS)",
    description: "基于目标文化规范，参考已有译文，尊重译入语习惯",
    promptPlaceholder: "例如：参考类似文本的翻译风格...",
    extraFields: [
      {
        type: "textarea",
        key: "referenceSource",
        label: "参考原文",
        placeholder: "粘贴类似风格的原文示例...",
      },
      {
        type: "textarea",
        key: "referenceTranslation",
        label: "参考译文",
        placeholder: "粘贴对应的译文示例...",
      },
    ],
  },
];

// 蓝图状态类型
interface BlueprintState {
  theories: {
    [key: string]: {
      enabled: boolean;
      prompt: string;
      extraData: { [key: string]: string };
    };
  };
  methodSlider: number; // 0 = 直译, 100 = 意译
  strategySlider: number; // 0 = 归化, 100 = 异化
  context: string;
}

const defaultBlueprintState: BlueprintState = {
  theories: {
    equivalence: { enabled: true, prompt: "", extraData: {} },
    functionalism: { enabled: false, prompt: "", extraData: {} },
    dts: { enabled: false, prompt: "", extraData: {} },
  },
  methodSlider: 50,
  strategySlider: 50,
  context: "",
};

export function SpecTranslation() {
  const { engines, defaultEngineId, getEnabledEngines } = useSettingsStore();
  const { addToHistory } = useTranslationStore();

  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("zh");
  const [selectedEngineId, setSelectedEngineId] = useState<string>(
    defaultEngineId || ""
  );
  const [blueprint, setBlueprint] = useState<BlueprintState>(defaultBlueprintState);
  const [result, setResult] = useState<SpecTranslateResponse | null>(null);
  const [expandedTheories, setExpandedTheories] = useState<Set<string>>(
    new Set(["equivalence"])
  );

  const enabledEngines = getEnabledEngines();
  const selectedEngine = engines.find((e) => e.id === selectedEngineId);

  const mutation = useMutation({
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

  const handleTranslate = () => {
    if (!sourceText.trim()) return;

    // 构建蓝图数据
    const enabledTheories = Object.entries(blueprint.theories)
      .filter(([, config]) => config.enabled)
      .map(([id, config]) => ({
        id,
        prompt: config.prompt,
        ...config.extraData,
      }));

    mutation.mutate({
      text: sourceText,
      source_lang: sourceLang,
      target_lang: targetLang,
      blueprint: {
        theory: {
          primary: enabledTheories[0]?.id || "equivalence",
          emphasis: enabledTheories.map((t) => t.id),
          configs: enabledTheories,
        },
        method: {
          preference: blueprint.methodSlider < 33 ? "literal" : blueprint.methodSlider > 66 ? "free" : "balanced",
          weight: blueprint.methodSlider / 100,
        },
        strategy: {
          approach: blueprint.strategySlider < 50 ? "domestication" : "foreignization",
          weight: Math.abs(blueprint.strategySlider - 50) / 50,
        },
        techniques: { useTerminology: false, extractTerms: false },
        context: blueprint.context,
      },
      engine: selectedEngineId,
    });
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const toggleTheoryExpand = (theoryId: string) => {
    setExpandedTheories((prev) => {
      const next = new Set(prev);
      if (next.has(theoryId)) {
        next.delete(theoryId);
      } else {
        next.add(theoryId);
      }
      return next;
    });
  };

  const updateTheory = (
    theoryId: string,
    updates: Partial<BlueprintState["theories"][string]>
  ) => {
    setBlueprint((prev) => ({
      ...prev,
      theories: {
        ...prev.theories,
        [theoryId]: { ...prev.theories[theoryId], ...updates },
      },
    }));
  };

  const updateTheoryExtraData = (
    theoryId: string,
    key: string,
    value: string
  ) => {
    setBlueprint((prev) => ({
      ...prev,
      theories: {
        ...prev.theories,
        [theoryId]: {
          ...prev.theories[theoryId],
          extraData: { ...prev.theories[theoryId].extraData, [key]: value },
        },
      },
    }));
  };

  const hasEngine = enabledEngines.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">规范翻译</h1>
        <p className="text-muted-foreground">
          基于翻译理论、方法和策略的专业翻译配置
        </p>
      </div>

      {!hasEngine && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              请先在设置页面配置并启用至少一个翻译引擎
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input & Blueprint */}
        <div className="space-y-4">
          {/* Source Text Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">→</span>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter((l) => l.code !== "auto")
                      .map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="输入要翻译的文本..."
                className="min-h-[150px] resize-none"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Engine Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译引擎</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEngineId}
                onValueChange={setSelectedEngineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择翻译引擎" />
                </SelectTrigger>
                <SelectContent>
                  {enabledEngines.map((engine) => (
                    <SelectItem key={engine.id} value={engine.id}>
                      {engine.name}
                      {engine.model && ` (${engine.model})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Translation Theories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译理论</CardTitle>
              <CardDescription>
                选择并配置要应用的翻译理论（可多选）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {theoryDefinitions.map((theory) => {
                const config = blueprint.theories[theory.id];
                const isExpanded = expandedTheories.has(theory.id);

                return (
                  <div
                    key={theory.id}
                    className={cn(
                      "border rounded-lg transition-colors",
                      config.enabled
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    {/* Theory Header */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(enabled) =>
                            updateTheory(theory.id, { enabled })
                          }
                        />
                        <div>
                          <div className="font-medium text-sm">{theory.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {theory.description}
                          </div>
                        </div>
                      </div>
                      {config.enabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTheoryExpand(theory.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Theory Config (Expanded) */}
                    {config.enabled && isExpanded && (
                      <div className="px-3 pb-3 pt-0 space-y-3 border-t">
                        <div className="pt-3 space-y-2">
                          <Label className="text-xs">额外提示词</Label>
                          <Input
                            placeholder={theory.promptPlaceholder}
                            value={config.prompt}
                            onChange={(e) =>
                              updateTheory(theory.id, { prompt: e.target.value })
                            }
                          />
                        </div>

                        {theory.extraFields?.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label className="text-xs">{field.label}</Label>
                            {field.type === "textarea" ? (
                              <Textarea
                                placeholder={field.placeholder}
                                className="min-h-[80px] resize-none text-sm"
                                value={config.extraData[field.key] || ""}
                                onChange={(e) =>
                                  updateTheoryExtraData(
                                    theory.id,
                                    field.key,
                                    e.target.value
                                  )
                                }
                              />
                            ) : (
                              <Input
                                placeholder={field.placeholder}
                                value={config.extraData[field.key] || ""}
                                onChange={(e) =>
                                  updateTheoryExtraData(
                                    theory.id,
                                    field.key,
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Method Slider */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译方法</CardTitle>
              <CardDescription>
                调整直译与意译的偏好程度
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>直译</span>
                <span>平衡</span>
                <span>意译</span>
              </div>
              <Slider
                value={[blueprint.methodSlider]}
                onValueChange={([value]) =>
                  setBlueprint((prev) => ({ ...prev, methodSlider: value }))
                }
                max={100}
                step={1}
              />
              <div className="text-center text-sm">
                {blueprint.methodSlider < 33 ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    偏向直译：尽量保持原文形式和结构
                  </span>
                ) : blueprint.methodSlider > 66 ? (
                  <span className="text-purple-600 dark:text-purple-400">
                    偏向意译：灵活处理，重视意义传达
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">
                    平衡模式：兼顾形式与意义
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strategy Slider */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译策略</CardTitle>
              <CardDescription>
                调整归化与异化的偏好程度
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>归化</span>
                <span>中立</span>
                <span>异化</span>
              </div>
              <Slider
                value={[blueprint.strategySlider]}
                onValueChange={([value]) =>
                  setBlueprint((prev) => ({ ...prev, strategySlider: value }))
                }
                max={100}
                step={1}
              />
              <div className="text-center text-sm">
                {blueprint.strategySlider < 40 ? (
                  <span className="text-orange-600 dark:text-orange-400">
                    偏向归化：使译文贴近目标语读者习惯
                  </span>
                ) : blueprint.strategySlider > 60 ? (
                  <span className="text-teal-600 dark:text-teal-400">
                    偏向异化：保留源语文化特色和异域风情
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">
                    中立模式：视具体情况灵活处理
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Context */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">额外上下文</CardTitle>
              <CardDescription>
                提供背景信息帮助翻译引擎更好地理解文本
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="例如：这是一篇科技论文摘要，讨论人工智能在医疗领域的应用..."
                className="min-h-[80px] resize-none"
                value={blueprint.context}
                onChange={(e) =>
                  setBlueprint((prev) => ({ ...prev, context: e.target.value }))
                }
              />
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleTranslate}
            disabled={!sourceText.trim() || !hasEngine || !selectedEngineId || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                翻译中...
              </>
            ) : (
              "开始翻译"
            )}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {mutation.isError && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <p className="text-destructive text-sm">
                  翻译失败: {mutation.error.message}
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">翻译结果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="whitespace-pre-wrap">
                      {result.translated_text}
                    </p>
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

          {!result && !mutation.isPending && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <div className="space-y-2">
                  <p>翻译结果将显示在这里</p>
                  <p className="text-sm">
                    配置好翻译理论、方法和策略后点击"开始翻译"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Config Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">当前配置摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">启用的理论:</span>
                  <span>
                    {Object.entries(blueprint.theories)
                      .filter(([, c]) => c.enabled)
                      .map(([id]) => theoryDefinitions.find((t) => t.id === id)?.name.split(" ")[0])
                      .join("、") || "无"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">翻译方法:</span>
                  <span>
                    {blueprint.methodSlider < 33
                      ? "直译"
                      : blueprint.methodSlider > 66
                      ? "意译"
                      : "平衡"}
                    ({blueprint.methodSlider}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">翻译策略:</span>
                  <span>
                    {blueprint.strategySlider < 40
                      ? "归化"
                      : blueprint.strategySlider > 60
                      ? "异化"
                      : "中立"}
                    ({blueprint.strategySlider}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
