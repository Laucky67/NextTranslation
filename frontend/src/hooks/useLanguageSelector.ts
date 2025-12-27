/**
 * 语言选择Hook
 */

import { useState, useCallback } from "react";
import { DEFAULTS } from "../lib/constants";

export function useLanguageSelector(
  initialSource: string = DEFAULTS.SOURCE_LANG,
  initialTarget: string = DEFAULTS.TARGET_LANG
) {
  const [sourceLang, setSourceLang] = useState(initialSource);
  const [targetLang, setTargetLang] = useState(initialTarget);

  const swapLanguages = useCallback(() => {
    // 不能交换自动检测
    if (sourceLang === "auto") return;

    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  }, [sourceLang, targetLang]);

  return {
    sourceLang,
    targetLang,
    setSourceLang,
    setTargetLang,
    swapLanguages,
    canSwap: sourceLang !== "auto",
  };
}
