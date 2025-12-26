import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Loader2, Info } from "lucide-react";
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
import { Slider } from "../components/ui/slider";
import { useSettingsStore } from "../stores/settings";
import { useTranslationStore } from "../stores/translation";
import {
  specTranslate,
  type SpecTranslateRequest,
  type SpecTranslateResponse,
} from "../api/translation";

const languages = [
  { code: "auto", name: "自动检测" },
  { code: "zh", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
];

// 翻译理论定义
const theoryDefinitions = [
  {
    id: "equivalence",
    name: "对等理论",
    englishName: "Equivalence Theory",
    description: "追求语义等值，优先传达原文的核心含义，保持信息对等",
    fields: [
      {
        key: "equivalenceType",
        label: "对等类型",
        type: "select" as const,
        options: [
          { value: "formal", label: "形式对等 - 保持原文形式结构" },
          { value: "dynamic", label: "动态对等 - 追求等效读者反应" },
        ],
        default: "dynamic",
      },
    ],
  },
  {
    id: "functionalism",
    name: "功能主义",
    englishName: "Skopos Theory",
    description: "以翻译目的为导向，根据目标读者需求调整翻译策略",
    fields: [
      {
        key: "purpose",
        label: "翻译目的",
        type: "text" as const,
        placeholder: "例如：用于学术发表、商业宣传、日常交流...",
      },
      {
        key: "targetAudience",
        label: "目标读者",
        type: "text" as const,
        placeholder: "例如：专业人士、普通大众、儿童...",
      },
    ],
  },
  {
    id: "dts",
    name: "描述翻译学",
    englishName: "Descriptive Translation Studies",
    description: "基于目标文化规范，参考已有译文，尊重译入语习惯",
    fields: [
      {
        key: "referenceSource",
        label: "参考原文",
        type: "textarea" as const,
        placeholder: "粘贴类似风格的原文示例...",
      },
      {
        key: "referenceTranslation",
        label: "参考译文",
        type: "textarea" as const,
        placeholder: "粘贴对应的译文示例...",
      },
    ],
  },
];

// 蓝图状态类型
interface BlueprintState {
  selectedTheory: string;
  theoryConfig: Record<string, string>;
  methodValue: number; // 1-10, 1=直译, 10=意译
  strategyValue: number; // 1-10, 1=归化, 10=异化
  context: string;
}

const defaultBlueprintState: BlueprintState = {
  selectedTheory: "equivalence",
  theoryConfig: {
    equivalenceType: "dynamic",
  },
  methodValue: 5,
  strategyValue: 5,
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

  const enabledEngines = getEnabledEngines();
  const selectedEngine = engines.find((e) => e.id === selectedEngineId);
  const currentTheory = theoryDefinitions.find((t) => t.id === blueprint.selectedTheory);

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

    // 将滑块值转换为权重 (1-10 -> 0-1)
    const methodWeight = (blueprint.methodValue - 1) / 9;
    const strategyWeight = (blueprint.strategyValue - 1) / 9;

    mutation.mutate({
      text: sourceText,
      source_lang: sourceLang,
      target_lang: targetLang,
      blueprint: {
        theory: {
          primary: blueprint.selectedTheory,
          emphasis: [blueprint.selectedTheory],
          configs: [{
            id: blueprint.selectedTheory,
            ...blueprint.theoryConfig,
          }],
        },
        method: {
          preference: blueprint.methodValue <= 3 ? "literal" : blueprint.methodValue >= 7 ? "free" : "balanced",
          weight: methodWeight,
        },
        strategy: {
          approach: blueprint.strategyValue <= 5 ? "domestication" : "foreignization",
          weight: Math.abs(strategyWeight - 0.5) * 2,
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

  const handleTheoryChange = (theoryId: string) => {
    const theory = theoryDefinitions.find((t) => t.id === theoryId);
    const defaultConfig: Record<string, string> = {};
    theory?.fields.forEach((field) => {
      if ("default" in field) {
        defaultConfig[field.key] = field.default;
      }
    });
    setBlueprint((prev) => ({
      ...prev,
      selectedTheory: theoryId,
      theoryConfig: defaultConfig,
    }));
  };

  const updateTheoryConfig = (key: string, value: string) => {
    setBlueprint((prev) => ({
      ...prev,
      theoryConfig: { ...prev.theoryConfig, [key]: value },
    }));
  };

  const hasEngine = enabledEngines.length > 0;

  // 获取方法和策略的描述文本
  const getMethodDescription = (value: number) => {
    if (value <= 3) return "偏向直译：尽量保持原文形式和结构";
    if (value >= 7) return "偏向意译：灵活处理，重视意义传达";
    return "平衡模式：兼顾形式与意义";
  };

  const getStrategyDescription = (value: number) => {
    if (value <= 3) return "偏向归化：使译文贴近目标语读者习惯";
    if (value >= 7) return "偏向异化：保留源语文化特色和异域风情";
    return "中立模式：视具体情况灵活处理";
  };

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

          {/* Translation Theory - 下拉框选择 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译理论</CardTitle>
              <CardDescription>
                选择翻译理论并配置相关参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={blueprint.selectedTheory}
                onValueChange={handleTheoryChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {theoryDefinitions.map((theory) => (
                    <SelectItem key={theory.id} value={theory.id}>
                      <div className="flex flex-col items-start">
                        <span>{theory.name} ({theory.englishName})</span>
                        <span className="text-xs text-muted-foreground">
                          {theory.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 理论具体配置 */}
              {currentTheory && currentTheory.fields.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  {currentTheory.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-sm">{field.label}</Label>
                      {field.type === "select" && "options" in field ? (
                        <Select
                          value={blueprint.theoryConfig[field.key] || ""}
                          onValueChange={(v) => updateTheoryConfig(field.key, v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === "textarea" ? (
                        <Textarea
                          placeholder={"placeholder" in field ? field.placeholder : ""}
                          className="min-h-[80px] resize-none text-sm"
                          value={blueprint.theoryConfig[field.key] || ""}
                          onChange={(e) => updateTheoryConfig(field.key, e.target.value)}
                        />
                      ) : (
                        <Input
                          placeholder={"placeholder" in field ? field.placeholder : ""}
                          value={blueprint.theoryConfig[field.key] || ""}
                          onChange={(e) => updateTheoryConfig(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Method Slider - 1-10 并显示数字 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译方法</CardTitle>
              <CardDescription>
                调整直译与意译的偏好程度 (1-10)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 直译</span>
                <span className="font-bold text-foreground text-lg">{blueprint.methodValue}</span>
                <span>意译 10</span>
              </div>
              <Slider
                value={[blueprint.methodValue]}
                onValueChange={([value]) =>
                  setBlueprint((prev) => ({ ...prev, methodValue: value }))
                }
                min={1}
                max={10}
                step={1}
              />
              <p className="text-center text-sm text-muted-foreground">
                {getMethodDescription(blueprint.methodValue)}
              </p>
            </CardContent>
          </Card>

          {/* Strategy Slider - 1-10 并显示数字 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译策略</CardTitle>
              <CardDescription>
                调整归化与异化的偏好程度 (1-10)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 归化</span>
                <span className="font-bold text-foreground text-lg">{blueprint.strategyValue}</span>
                <span>异化 10</span>
              </div>
              <Slider
                value={[blueprint.strategyValue]}
                onValueChange={([value]) =>
                  setBlueprint((prev) => ({ ...prev, strategyValue: value }))
                }
                min={1}
                max={10}
                step={1}
              />
              <p className="text-center text-sm text-muted-foreground">
                {getStrategyDescription(blueprint.strategyValue)}
              </p>
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
                  <span className="text-muted-foreground">翻译理论:</span>
                  <span>{currentTheory?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">翻译方法:</span>
                  <span>
                    {blueprint.methodValue <= 3
                      ? "直译"
                      : blueprint.methodValue >= 7
                      ? "意译"
                      : "平衡"}
                    ({blueprint.methodValue}/10)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">翻译策略:</span>
                  <span>
                    {blueprint.strategyValue <= 3
                      ? "归化"
                      : blueprint.strategyValue >= 7
                      ? "异化"
                      : "中立"}
                    ({blueprint.strategyValue}/10)
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
