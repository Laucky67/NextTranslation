/**
 * 警告提示卡片组件
 */

import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import type { WarningAlertProps } from "../../types";
import { cn } from "../../lib/utils";

export function WarningAlert({
  message,
  type = "warning",
  className,
}: WarningAlertProps) {
  const isWarning = type === "warning";

  return (
    <Card
      className={cn(
        isWarning
          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
          : "border-blue-500 bg-blue-50 dark:bg-blue-950",
        className
      )}
    >
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          {isWarning ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={cn(
              "text-sm",
              isWarning
                ? "text-yellow-800 dark:text-yellow-200"
                : "text-blue-800 dark:text-blue-200"
            )}
          >
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
