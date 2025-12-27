import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
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
import { useTranslationStore } from "../stores/translation";
import { easyTranslate, type EasyTranslateRequest } from "../api/translation";
import { PageHeader } from "../components/layout/PageHeader";
import { CopyButton, LoadingButton, WarningAlert, ErrorAlert } from "../components/common";
import { useLanguageSelector, useEngineConfig } from "../hooks";
import { LANGUAGES, TARGET_LANGUAGES } from "../lib/constants";

export function EasyTranslation() {
  const { history, addToHistory, clearHistory, removeFromHistory } =
    useTranslationStore();

  // 使用自定义Hooks
  const { sourceLang, targetLang, setSourceLang, setTargetLang, swapLanguages, canSwap } =
    useLanguageSelector();
  const { enabledEngines, selectedEngineId, selectedEngine, setSelectedEngineId, hasEngine } =
    useEngineConfig();

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
    if (canSwap) {
      swapLanguages();
      // 交换文本内容
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  const easyHistory = useMemo(
    () => history.filter((item) => item.mode === "easy").slice(0, 10),
    [history]
  );

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
            <div className="flex items-center justify-between">
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwapLanguages}
                disabled={!canSwap}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_LANGUAGES.map((lang) => (
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
              className="min-h-[200px] resize-none"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{sourceText.length} 字符</span>
              <CopyButton text={sourceText} />
            </div>
          </CardContent>
        </Card>

        {/* Target */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">翻译结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[200px] rounded-md border bg-muted/50 p-3">
              {mutation.isPending ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">翻译中...</div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">
                  {translatedText || "翻译结果将显示在这里"}
                </p>
              )}
            </div>
            {mutation.isError && (
              <ErrorAlert error={mutation.error} title="翻译失败" />
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{translatedText.length} 字符</span>
              <CopyButton text={translatedText} />
            </div>
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
              <Select value={selectedEngineId} onValueChange={setSelectedEngineId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择引擎" />
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
      {easyHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">最近翻译</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <Trash2 className="h-3 w-3 mr-1" />
                清空
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {easyHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded-md border bg-muted/30 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-muted-foreground">
                      {item.sourceText}
                    </p>
                    <p className="truncate font-medium">{item.translatedText}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <CopyButton text={item.translatedText} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeFromHistory(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
