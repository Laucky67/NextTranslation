/**
 * 翻译结果卡片组件
 * 用于显示单个引擎的翻译结果、评分和评语
 */

import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { CopyButton } from "../../common";
import type { ScoredEngineResult } from "../../../api/translation";
import { cn } from "../../../lib/utils";

interface ResultCardProps {
  result: ScoredEngineResult;
  isTopScore?: boolean;
  onCopy?: (text: string) => void;
  className?: string;
}

export function ResultCard({
  result,
  isTopScore = false,
  onCopy,
  className,
}: ResultCardProps) {
  // 失败状态
  if (!result.success) {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{result.engine_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">失败: {result.error}</p>
        </CardContent>
      </Card>
    );
  }

  // 成功状态
  return (
    <Card
      className={cn(
        isTopScore && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{result.engine_name}</CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            {isTopScore && (
              <span className="text-yellow-700 dark:text-yellow-300">
                分数最高
              </span>
            )}
            {result.score && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                {result.score.overall.toFixed(1)}
              </div>
            )}
          </div>
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

        {result.score?.comment && (
          <p className="text-xs text-muted-foreground">
            评语：{result.score.comment}
          </p>
        )}

        <div className="flex justify-end">
          {onCopy && <CopyButton text={result.translated_text} />}
        </div>
      </CardContent>
    </Card>
  );
}

// 评分项组件
function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value.toFixed(1)}</div>
    </div>
  );
}
