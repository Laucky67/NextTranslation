/**
 * 翻译决策列表组件
 * 显示AI翻译过程中的决策说明
 */

import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import type { DecisionListProps } from "../../../types";

export function DecisionList({ decisions, className }: DecisionListProps) {
  if (!decisions || decisions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4" />
          <CardTitle className="text-base">翻译决策说明</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {decisions.map((decision, index) => (
            <div
              key={index}
              className="p-2 rounded-md bg-muted/30 text-sm"
            >
              <div className="font-medium">{decision.aspect}</div>
              <div className="text-muted-foreground">
                {decision.decision} - {decision.rationale}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
