/**
 * 复制按钮组件
 */

import { Check, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { useCopyToClipboard } from "../../hooks";
import type { CopyButtonProps } from "../../types";
import { cn } from "../../lib/utils";

export function CopyButton({
  text,
  size = "sm",
  variant = "ghost",
  className,
}: CopyButtonProps) {
  const { copy, copied } = useCopyToClipboard();

  const handleCopy = async () => {
    if (text) {
      await copy(text);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={!text}
      className={cn(className)}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-1" />
          已复制
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          复制
        </>
      )}
    </Button>
  );
}
