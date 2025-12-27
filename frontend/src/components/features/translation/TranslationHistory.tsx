/**
 * 翻译历史记录组件
 * 显示最近的翻译记录，支持复制、删除和清空
 */

import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { CopyButton } from "../../common";
import type { TranslationHistoryProps } from "../../../types";

export function TranslationHistory({
  items,
  mode,
  onDelete,
  onClear,
  maxItems = 10,
  className,
}: TranslationHistoryProps) {
  // 过滤指定模式的记录
  const filteredItems = mode
    ? items.filter((item) => item.mode === mode).slice(0, maxItems)
    : items.slice(0, maxItems);

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">最近翻译</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="h-3 w-3 mr-1" />
            清空
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredItems.map((item) => (
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
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
