import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useTranslationStore } from "../stores/translation";
import { easyTranslate, type EasyTranslateRequest } from "../api/translation";
import { PageHeader } from "../components/layout/PageHeader";
import { LoadingButton, WarningAlert } from "../components/common";
import { LanguageSelector, TranslationTextArea, EngineSelector, TranslationHistory } from "../components/features/translation";
import { useLanguageSelector, useEngineConfig, useCopyToClipboard } from "../hooks";
import { LANGUAGES } from "../lib/constants";

export function EasyTranslation() {
  const { history, addToHistory, clearHistory, removeFromHistory } =
    useTranslationStore();

  // 使用自定义Hooks
  const { sourceLang, targetLang, setSourceLang, setTargetLang, swapLanguages } =
    useLanguageSelector();
  const { enabledEngines, selectedEngineId, selectedEngine, setSelectedEngineId, hasEngine } =
    useEngineConfig();
  const { copy } = useCopyToClipboard();

  const [sourceText, setSourceText] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const mutation = useMutation({
    mutationFn: (request: EasyTranslateRequest) => {
      if (!selectedEngine) throw new Error("请先选择翻译引擎");
      return easyTranslate(request, {
        apiKey: selectedEngine.apiKey,
        baseUrl: selectedEngine.baseUrl,
        channel: selectedEngine.channel,
        model: selectedEngine.model,
      });
    },
    onSuccess: (data) => {
      setTranslatedText(data.translated_text);
      addToHistory({
        sourceText,
        translatedText: data.translated_text,
        sourceLang: data.source_lang,
        targetLang: data.target_lang,
        engine: selectedEngineId,
        mode: "easy",
      });
    },
  });

  const handleTranslate = () => {
    if (!sourceText.trim()) return;

    mutation.mutate({
      text: sourceText,
      source_lang: sourceLang,
      target_lang: targetLang,
      prompt: customPrompt || undefined,
      engine: selectedEngineId,
    });
  };

  const handleSwapLanguages = () => {
    swapLanguages();
    // 交换文本内容
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="简易翻译" description="快速翻译，支持自定义提示词" />

      {!hasEngine && (
        <WarningAlert message="请先在设置页面配置并启用至少一个翻译引擎" />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Source */}
        <Card>
          <CardHeader className="pb-3">
            <LanguageSelector
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSourceChange={setSourceLang}
              onTargetChange={setTargetLang}
              onSwap={handleSwapLanguages}
              languages={LANGUAGES}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <TranslationTextArea
              value={sourceText}
              onChange={setSourceText}
              placeholder="输入要翻译的文本..."
              onCopy={copy}
              minHeight="200px"
            />
          </CardContent>
        </Card>

        {/* Target */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">翻译结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TranslationTextArea
              value={translatedText}
              onChange={setTranslatedText}
              placeholder={mutation.isPending ? "翻译中..." : "翻译结果将显示在这里"}
              onCopy={copy}
              readOnly
              minHeight="200px"
            />
          </CardContent>
        </Card>
      </div>

      {/* Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">翻译选项</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>翻译引擎</Label>
              <EngineSelector
                engines={enabledEngines}
                value={selectedEngineId}
                onChange={setSelectedEngineId}
                placeholder="选择引擎"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>自定义提示词（可选）</Label>
              <Input
                placeholder="例如：使用正式语气、保留专业术语..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Translate Button */}
      <div className="flex justify-center">
        <LoadingButton
          size="lg"
          onClick={handleTranslate}
          disabled={!sourceText.trim() || !hasEngine}
          loading={mutation.isPending}
        >
          开始翻译
        </LoadingButton>
      </div>

      {/* History */}
      <TranslationHistory
        items={history}
        mode="easy"
        onDelete={removeFromHistory}
        onClear={clearHistory}
      />
    </div>
  );
}
