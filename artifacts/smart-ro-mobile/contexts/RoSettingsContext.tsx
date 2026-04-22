import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "smart-ro-refresh-interval";
const DEFAULT_INTERVAL = 10_000;

type RoSettingsContextValue = {
  refreshIntervalMs: number;
  setRefreshIntervalMs: (value: number) => void;
  intervalOptions: number[];
};

const RoSettingsContext = createContext<RoSettingsContextValue | null>(null);

export function RoSettingsProvider({ children }: { children: React.ReactNode }) {
  const [refreshIntervalMs, setRefreshIntervalMsState] = useState(DEFAULT_INTERVAL);
  const intervalOptions = useMemo(() => [5_000, 10_000, 30_000, 60_000], []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        const parsed = Number(value);
        if (mounted && intervalOptions.includes(parsed)) {
          setRefreshIntervalMsState(parsed);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [intervalOptions]);

  const setRefreshIntervalMs = (value: number) => {
    setRefreshIntervalMsState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => undefined);
  };

  const value = useMemo(
    () => ({ refreshIntervalMs, setRefreshIntervalMs, intervalOptions }),
    [refreshIntervalMs, intervalOptions],
  );

  return <RoSettingsContext.Provider value={value}>{children}</RoSettingsContext.Provider>;
}

export function useRoSettings() {
  const context = useContext(RoSettingsContext);
  if (!context) throw new Error("useRoSettings must be used inside RoSettingsProvider");
  return context;
}
