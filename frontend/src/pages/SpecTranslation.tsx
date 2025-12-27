import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useSettingsStore } from "../stores/settings";
import { useTranslationStore } from "../stores/translation";
import { PageHeader } from "../components/layout/PageHeader";
import { LoadingButton, ErrorAlert, CopyButton } from "../components/common";
import { EngineSelector } from "../components/features/translation";
import { TheoryCard, MethodStrategySelector, BlueprintView, DecisionList } from "../components/features/spec-translation";
import { LANGUAGES, THEORY_DEFINITIONS } from "../lib/constants";
import {
  specGenerateBlueprint,
  specTranslate,
  type SpecTranslateRequest,
  type SpecTranslateResponse,
} from "../api/specTranslation";
import type {
  SpecBlueprintRequest,
  SpecBlueprintResponse,
  TheoryConfig,
  TranslationBlueprint,
} from "../api/specBlueprint";
import type { BlueprintDraftState } from "../types";

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

  const updatePromptBlock = (blockId: string, content: string) => {
    setGeneratedBlueprint((prev) => {
      if (!prev?.prompt_blocks) return prev;
      const nextBlocks = prev.prompt_blocks.map((b) =>
        b.id === blockId ? { ...b, content } : b
      );
      return { ...prev, prompt_blocks: nextBlocks };
    });
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
                      {LANGUAGES.map((lang) => (
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
                      {LANGUAGES.filter((lang) => lang.code !== "auto").map((lang) => (
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
              <EngineSelector
                engines={enabledEngines}
                value={selectedEngineId}
                onChange={setSelectedEngineId}
                placeholder="选择翻译引擎"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">翻译理论（可多选）</CardTitle>
              <CardDescription>启用的理论会参与蓝图生成与提示词分块</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <TheoryCard
                id="equivalence"
                title={`${THEORY_DEFINITIONS[0].name}（${THEORY_DEFINITIONS[0].englishName}）`}
                description={THEORY_DEFINITIONS[0].description}
                enabled={draft.theories.equivalence.enabled}
                onToggle={(checked) => {
                  setDraft((prev) => ({
                    ...prev,
                    theories: { ...prev.theories, equivalence: { enabled: checked } },
                  }));
                  markDraftChanged();
                }}
              />

              <TheoryCard
                id="functionalism"
                title={`${THEORY_DEFINITIONS[1].name}（${THEORY_DEFINITIONS[1].englishName}）`}
                description={THEORY_DEFINITIONS[1].description}
                enabled={draft.theories.functionalism.enabled}
                onToggle={(checked) => {
                  setDraft((prev) => ({
                    ...prev,
                    theories: {
                      ...prev.theories,
                      functionalism: { ...prev.theories.functionalism, enabled: checked },
                    },
                  }));
                  markDraftChanged();
                }}
                purpose={draft.theories.functionalism.purpose}
                targetAudience={draft.theories.functionalism.targetAudience}
                onPurposeChange={(value) => {
                  setDraft((prev) => ({
                    ...prev,
                    theories: {
                      ...prev.theories,
                      functionalism: { ...prev.theories.functionalism, purpose: value },
                    },
                  }));
                  markDraftChanged();
                }}
                onTargetAudienceChange={(value) => {
                  setDraft((prev) => ({
                    ...prev,
                    theories: {
                      ...prev.theories,
                      functionalism: { ...prev.theories.functionalism, targetAudience: value },
                    },
                  }));
                  markDraftChanged();
                }}
              />

              <TheoryCard
                id="dts"
                title={`${THEORY_DEFINITIONS[2].name}（${THEORY_DEFINITIONS[2].englishName}）`}
                description={THEORY_DEFINITIONS[2].description}
                enabled={draft.theories.dts.enabled}
                onToggle={(checked) => {
                  setDraft((prev) => ({
                    ...prev,
                    theories: {
                      ...prev.theories,
                      dts: { ...prev.theories.dts, enabled: checked },
                    },
                  }));
                  markDraftChanged();
                }}
                referenceSource={draft.theories.dts.referenceSource}
                referenceTranslation={draft.theories.dts.referenceTranslation}
                onReferenceSourceChange={(value) => {
                  setDraft((prev) => ({
                    ...prev,
                    theories: {
                      ...prev.theories,
                      dts: { ...prev.theories.dts, referenceSource: value },
                    },
                  }));
                  markDraftChanged();
                }}
                onReferenceTranslationChange={(value) => {
                  setDraft((prev) => ({
                    ...prev,
                    theories: {
                      ...prev.theories,
                      dts: { ...prev.theories.dts, referenceTranslation: value },
                    },
                  }));
                  markDraftChanged();
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">翻译方法与策略</CardTitle>
              <CardDescription>生成蓝图后可在分块中进一步微调</CardDescription>
            </CardHeader>
            <CardContent>
              <MethodStrategySelector
                methodValue={draft.methodValue}
                strategyValue={draft.strategyValue}
                context={draft.context}
                onMethodChange={(value) => {
                  setDraft((prev) => ({ ...prev, methodValue: value }));
                  markDraftChanged();
                }}
                onStrategyChange={(value) => {
                  setDraft((prev) => ({ ...prev, strategyValue: value }));
                  markDraftChanged();
                }}
                onContextChange={(value) => {
                  setDraft((prev) => ({ ...prev, context: value }));
                  markDraftChanged();
                }}
              />
            </CardContent>
          </Card>

          {!generatedBlueprint ? (
            <LoadingButton
              className="w-full"
              size="lg"
              onClick={handleGenerateBlueprint}
              disabled={
                !sourceText.trim() ||
                !hasEngine ||
                !selectedEngineId ||
                blueprintMutation.isPending
              }
              loading={blueprintMutation.isPending}
            >
              生成蓝图
            </LoadingButton>
          ) : (
            <LoadingButton
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
              loading={blueprintMutation.isPending}
            >
              重新生成蓝图
            </LoadingButton>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {blueprintMutation.isError && (
            <ErrorAlert
              error={blueprintMutation.error instanceof Error
                ? blueprintMutation.error
                : "蓝图生成失败"}
              title="蓝图生成失败"
            />
          )}

          {translateMutation.isError && (
            <ErrorAlert
              error={translateMutation.error instanceof Error
                ? translateMutation.error
                : "翻译失败"}
              title="翻译失败"
            />
          )}

          {!generatedBlueprint && !blueprintMutation.isPending && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <div className="space-y-2">
                  <p>蓝图将显示在这里</p>
                  <p className="text-sm">配置好理论、方法和策略后点击"生成蓝图"</p>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedBlueprint && (
            <div className="space-y-3">
              <BlueprintView
                blueprint={generatedBlueprint}
                isStale={isBlueprintStale}
                onBlockUpdate={updatePromptBlock}
              />

              <LoadingButton
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
                loading={translateMutation.isPending}
              >
                {result ? "重新翻译" : "开始翻译"}
              </LoadingButton>
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
                    <CopyButton text={result.translated_text} />
                  </div>
                </CardContent>
              </Card>

              {result.decisions && result.decisions.length > 0 && (
                <DecisionList decisions={result.decisions} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
