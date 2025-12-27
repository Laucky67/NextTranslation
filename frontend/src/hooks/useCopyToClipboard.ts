/**
 * 复制到剪贴板Hook
 */

import { useState, useCallback } from "react";

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒后重置状态
      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      setCopied(false);
      return false;
    }
  }, []);

  return { copy, copied };
}
