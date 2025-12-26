import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Loader2, Star, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
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
import { useSettingsStore } from "../stores/settings";
import { useTranslationStore } from "../stores/translation";
import {
  vibeTranslate,
  type VibeTranslateRequest,
  type VibeTranslateResponse,
  type ScoredEngineResult,
  type EngineConfig,
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
  { code: "es", name: "西班牙语" },
];

export function VibeTranslation() {
  const { engines, getEnabledEngines } = useSettingsStore();
  const { addToHistory } = useTranslationStore();

  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("zh");
  const [intent, setIntent] = useState("");
  const [selectedEngineIds, setSelectedEngineIds] = useState<string[]>([]);
  const [result, setResult] = useState<VibeTranslateResponse | null>(null);

  const enabledEngines = getEnabledEngines();

  const mutation = useMutation({
    mutationFn: (request: VibeTranslateRequest) => {
      // 获取所选引擎的配置
      const engineConfigs: EngineConfig[] = selectedEngineIds
        .map((id) => {
          const engine = engines.find((e) => e.id === id);
          if (!engine) return null;
          const config: EngineConfig = {
            apiKey: engine.apiKey,
            baseUrl: engine.baseUrl,
            channel: engine.channel,
          };
          if (engine.model) {
            config.model = engine.model;
          }
          return config;
        })
        .filter((c): c is EngineConfig => c !== null);

      if (engineConfigs.length === 0) {
        throw new Error("请至少选择一个翻译引擎");
      }

      return vibeTranslate(request, engineConfigs);
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.best_result) {
        addToHistory({
          sourceText,
          translatedText: data.best_result.translated_text,
          sourceLang: data.source_lang,
          targetLang: data.target_lang,
          engine: data.best_result.engine_id,
          mode: "vibe",
        });
      }
    },
  });

  const handleTranslate = () => {
    if (!sourceText.trim() || !intent.trim()) return;

    mutation.mutate({
      text: sourceText,
      source_lang: sourceLang,
      target_lang: targetLang,
      intent,
      engines: selectedEngineIds,
    });
  };

  const toggleEngine = (engineId: string) => {
    setSelectedEngineIds((prev) =>
      prev.includes(engineId)
        ? prev.filter((e) => e !== engineId)
        : [...prev, engineId]
    );
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const hasEngines = enabledEngines.length > 0;
  const hasSelectedEngines = selectedEngineIds.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">氛围翻译</h1>
        <p className="text-muted-foreground">
          多引擎并行翻译，智能评分推荐最佳结果
        </p>
      </div>

      {!hasEngines && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              请先在设置页面配置并启用至少一个翻译引擎
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
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
            <CardContent className="space-y-4">
              <Textarea
                placeholder="输入要翻译的文本..."
                className="min-h-[150px] resize-none"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">翻译意图</CardTitle>
              <CardDescription>
                描述你希望的翻译风格和目标，帮助评判哪个翻译最符合你的需求
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="例如：学术论文风格、口语化、保留原文韵味..."
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">选择引擎</CardTitle>
              <CardDescription>
                选择多个引擎进行并行翻译，系统将根据你的意图评分推荐最佳结果
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enabledEngines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  没有可用的引擎，请先在设置页面配置
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {enabledEngines.map((engine) => (
                    <Button
                      key={engine.id}
                      variant={
                        selectedEngineIds.includes(engine.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleEngine(engine.id)}
                    >
                      {engine.name}
                      {engine.model && ` (${engine.model})`}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleTranslate}
            disabled={
              !sourceText.trim() ||
              !intent.trim() ||
              !hasSelectedEngines ||
              mutation.isPending
            }
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

        {/* Results Section */}
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

          {result?.best_result && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base text-green-700 dark:text-green-300">
                    最佳推荐
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">
                  {result.best_result.engine_name}
                </p>
                <p className="whitespace-pre-wrap">
                  {result.best_result.translated_text}
                </p>
                {result.best_result.score && (
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {result.best_result.score.overall.toFixed(1)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(result.best_result!.translated_text)
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      复制
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result?.results && result.results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">所有结果</h3>
              {result.results.map((r) => (
                <ResultCard
                  key={r.engine_id}
                  result={r}
                  isBest={r.engine_id === result.best_result?.engine_id}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}

          {!result && !mutation.isPending && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <div className="space-y-2">
                  <p>翻译结果将显示在这里</p>
                  <p className="text-sm">
                    选择多个引擎后点击"开始翻译"进行并行翻译
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  isBest,
  onCopy,
}: {
  result: ScoredEngineResult;
  isBest: boolean;
  onCopy: (text: string) => void;
}) {
  if (!result.success) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{result.engine_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">失败: {result.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(isBest && "ring-2 ring-green-500")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{result.engine_name}</CardTitle>
          {result.score && (
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              {result.score.overall.toFixed(1)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{result.translated_text}</p>

        {result.score && (
          <div className="grid grid-cols-4 gap-2 text-xs">
            <ScoreItem label="准确性" value={result.score.accuracy} />
            <ScoreItem label="流畅度" value={result.score.fluency} />
            <ScoreItem label="风格" value={result.score.style_match} />
            <ScoreItem label="术语" value={result.score.terminology} />
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(result.translated_text)}
          >
            <Copy className="h-3 w-3 mr-1" />
            复制
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value.toFixed(1)}</div>
    </div>
  );
}
