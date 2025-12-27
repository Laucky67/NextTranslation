/**
 * 错误提示卡片组件
 */

import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import type { ErrorAlertProps } from "../../types";
import { cn } from "../../lib/utils";

export function ErrorAlert({
  error,
  title = "错误",
  onRetry,
  className,
}: ErrorAlertProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className={cn("border-destructive", className)}>
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="font-medium text-destructive">{title}</p>
            <p className="text-sm text-destructive">{errorMessage}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                重试
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
