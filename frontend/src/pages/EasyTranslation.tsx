import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRightLeft, Copy, Loader2, Trash2 } from "lucide-react";
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
import { useSettingsStore } from "../stores/settings";
import { useTranslationStore } from "../stores/translation";
import { easyTranslate, type EasyTranslateRequest } from "../api/translation";

const languages = [
  { code: "auto", name: "自动检测" },
  { code: "zh", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
  { code: "es", name: "西班牙语" },
  { code: "pt", name: "葡萄牙语" },
  { code: "ru", name: "俄语" },
];

export function EasyTranslation() {
  const { engines, defaultEngineId, getEnabledEngines } = useSettingsStore();
  const { history, addToHistory, clearHistory, removeFromHistory } =
    useTranslationStore();

  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("zh");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedEngineId, setSelectedEngineId] = useState(defaultEngineId || "");
  const [translatedText, setTranslatedText] = useState("");

  const enabledEngines = getEnabledEngines();
  const selectedEngine = engines.find((e) => e.id === selectedEngineId);

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
    if (sourceLang !== "auto") {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const easyHistory = useMemo(
    () => history.filter((item) => item.mode === "easy").slice(0, 10),
    [history]
  );

  const hasEngine = enabledEngines.length > 0 && selectedEngineId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">简易翻译</h1>
        <p className="text-muted-foreground">快速翻译，支持自定义提示词</p>
      </div>

      {enabledEngines.length === 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              请先在设置页面配置并启用至少一个翻译引擎
            </p>
          </CardContent>
        </Card>
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
                  {languages.map((lang) => (
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
                disabled={sourceLang === "auto"}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
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
              className="min-h-[200px] resize-none"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{sourceText.length} 字符</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(sourceText)}
                disabled={!sourceText}
              >
                <Copy className="h-3 w-3 mr-1" />
                复制
              </Button>
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
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : mutation.isError ? (
                <p className="text-destructive text-sm">
                  翻译失败: {mutation.error.message}
                </p>
              ) : (
                <p className="whitespace-pre-wrap">
                  {translatedText || "翻译结果将显示在这里"}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{translatedText.length} 字符</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(translatedText)}
                disabled={!translatedText}
              >
                <Copy className="h-3 w-3 mr-1" />
                复制
              </Button>
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
        <Button
          size="lg"
          onClick={handleTranslate}
          disabled={!sourceText.trim() || !hasEngine || mutation.isPending}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(item.translatedText)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
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
