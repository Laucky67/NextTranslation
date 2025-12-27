/**
 * 引擎配置Hook
 */

import { useState, useMemo, useEffect } from "react";
import { useSettingsStore } from "../stores/settings";

export function useEngineConfig(initialEngineId?: string) {
  const { engines, defaultEngineId, getEnabledEngines } = useSettingsStore();
  const [selectedEngineId, setSelectedEngineId] = useState<string>(
    initialEngineId || defaultEngineId || ""
  );

  const enabledEngines = useMemo(() => getEnabledEngines(), [engines]);
  const selectedEngine = useMemo(
    () => engines.find((e) => e.id === selectedEngineId),
    [engines, selectedEngineId]
  );

  // 如果默认引擎改变且当前没有选中引擎，更新为默认引擎
  useEffect(() => {
    if (!selectedEngineId && defaultEngineId) {
      setSelectedEngineId(defaultEngineId);
    }
  }, [defaultEngineId, selectedEngineId]);

  return {
    engines,
    enabledEngines,
    selectedEngineId,
    selectedEngine,
    setSelectedEngineId,
    hasEngine: enabledEngines.length > 0,
  };
}
