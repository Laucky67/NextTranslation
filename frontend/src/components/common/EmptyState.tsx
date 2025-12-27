/**
 * 空状态占位组件
 */

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import type { EmptyStateProps } from "../../types";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="py-12 text-center text-muted-foreground">
        <div className="space-y-4">
          {icon && <div className="flex justify-center">{icon}</div>}
          <div className="space-y-2">
            <p className="font-medium">{title}</p>
            {description && <p className="text-sm">{description}</p>}
          </div>
          {action && (
            <Button onClick={action.onClick} variant="outline">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
