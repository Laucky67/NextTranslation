import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Trophy } from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useSettingsStore } from "../stores/settings";
import { useTranslationStore } from "../stores/translation";
import {
  vibeTranslateStream,
  type VibeTranslateRequest,
  type VibeTranslateResponse,
  type EngineConfig,
} from "../api/translation";
import { PageHeader } from "../components/layout/PageHeader";
import { LoadingButton, WarningAlert } from "../components/common";
import {
  LanguageSelector,
  TranslationTextArea,
  EngineMultiSelect,
  EngineSelector,
  ResultCard
} from "../components/features/translation";
import { useLanguageSelector, useEngineConfig, useCopyToClipboard } from "../hooks";
import { LANGUAGES } from "../lib/constants";

export function VibeTranslation() {
  const { engines } = useSettingsStore();
  const { addToHistory } = useTranslationStore();

  // 使用自定义Hooks
  const { sourceLang, targetLang, setSourceLang, setTargetLang } = useLanguageSelector();
  const { enabledEngines, hasEngine } = useEngineConfig();
  const { copy } = useCopyToClipboard();

  const [sourceText, setSourceText] = useState("");
  const [intent, setIntent] = useState("");
  const [selectedEngineIds, setSelectedEngineIds] = useState<string[]>([]);
  const [judgeEngineId, setJudgeEngineId] = useState<string>("auto");
  const [result, setResult] = useState<VibeTranslateResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (request: VibeTranslateRequest) => {
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

      const judgeEngine =
        judgeEngineId === "auto"
          ? null
          : engines.find((e) => e.id === judgeEngineId) || null;
      const judgeConfig: EngineConfig | undefined = judgeEngine
        ? {
            apiKey: judgeEngine.apiKey,
            baseUrl: judgeEngine.baseUrl,
            channel: judgeEngine.channel,
            model: judgeEngine.model,
          }
        : undefined;

      setResult({
        source_lang: request.source_lang,
        target_lang: request.target_lang,
        intent: request.intent,
        results: [],
      });

      return vibeTranslateStream(request, engineConfigs, judgeConfig, {
        onPartial: (partial) => {
          setResult((prev) => {
            const base: VibeTranslateResponse = prev || {
              source_lang: request.source_lang,
              target_lang: request.target_lang,
              intent: request.intent,
              results: [],
            };
            const idx = base.results.findIndex((r) => r.engine_id === partial.engine_id);
            const nextResults = [...base.results];
            if (idx >= 0) nextResults[idx] = partial;
            else nextResults.push(partial);
            return { ...base, results: nextResults };
          });
        },
        onFinal: (final) => {
          setResult(final);
        },
      });
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.best_result) {
        const finalText =
          data.synthesized_translation || data.best_result.translated_text;
        addToHistory({
          sourceText,
          translatedText: finalText,
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

  const hasSelectedEngines = selectedEngineIds.length > 0;
  const topScoreEngineId = (() => {
    if (!result?.results?.length) return null;
    let best: { engineId: string; score: number } | null = null;
    for (const r of result.results) {
      if (!r.success || !r.score) continue;
      if (!best || r.score.overall > best.score) {
        best = { engineId: r.engine_id, score: r.score.overall };
      }
    }
    return best?.engineId || null;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="氛围翻译"
        description="多引擎并行翻译，智能评分推荐最佳结果"
      />

      {!hasEngine && (
        <WarningAlert message="请先在设置页面配置并启用至少一个翻译引擎" />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <LanguageSelector
                sourceLang={sourceLang}
                targetLang={targetLang}
                onSourceChange={setSourceLang}
                onTargetChange={setTargetLang}
                languages={LANGUAGES}
                showSwap={false}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <TranslationTextArea
                value={sourceText}
                onChange={setSourceText}
                placeholder="输入要翻译的文本..."
                onCopy={copy}
                minHeight="150px"
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
                <EngineMultiSelect
                  engines={enabledEngines}
                  selected={selectedEngineIds}
                  onToggle={toggleEngine}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">裁判模型</CardTitle>
              <CardDescription>
                选择用于打分与综合生成"综合推荐"的引擎/模型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngineSelector
                engines={[
                  { id: "auto", name: "自动", channel: "openai" as const, apiKey: "", baseUrl: "", enabled: true },
                  ...enabledEngines
                ]}
                value={judgeEngineId}
                onChange={setJudgeEngineId}
                placeholder="选择裁判引擎"
              />
            </CardContent>
          </Card>

          <LoadingButton
            className="w-full"
            size="lg"
            onClick={handleTranslate}
            disabled={!sourceText.trim() || !intent.trim() || !hasSelectedEngines}
            loading={mutation.isPending}
          >
            开始翻译
          </LoadingButton>
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
                    综合推荐
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">
                  {result.best_result.engine_name}
                </p>
                <p className="whitespace-pre-wrap">
                  {result.synthesized_translation || result.best_result.translated_text}
                </p>
                {result.best_result.score?.comment && (
                  <p className="text-xs text-muted-foreground">
                    评语：{result.best_result.score.comment}
                  </p>
                )}
                {result.synthesis_rationale && (
                  <p className="text-xs text-muted-foreground">
                    综合说明：{result.synthesis_rationale}
                  </p>
                )}
                {result.best_result.score && (
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {result.best_result.score.overall.toFixed(1)}
                    </span>
                    <LoadingButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const text = result.synthesized_translation || result.best_result!.translated_text;
                        copy(text);
                      }}
                    >
                      复制
                    </LoadingButton>
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
                  isTopScore={r.engine_id === topScoreEngineId}
                  onCopy={copy}
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
