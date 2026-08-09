"use client";

import { useCallback, useEffect, useState } from "react";
import { clearState, loadState, saveState, type StoredState } from "./storage";

export function useVisitState() {
  const [state, setState] = useState<StoredState>({ teamId: null, dates: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage는 서버에 없으므로 SSR 결과와 항상 일치시킬 수 없다.
    // 마운트 후 클라이언트에서 한 번만 읽어와 하이드레이션 불일치를 피하는 의도적 패턴.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const setTeam = useCallback((teamId: string) => {
    setState((prev) => (prev.teamId === teamId ? prev : { teamId, dates: [] }));
  }, []);

  const toggleDate = useCallback((date: string) => {
    setState((prev) => {
      const exists = prev.dates.includes(date);
      const dates = exists ? prev.dates.filter((d) => d !== date) : [...prev.dates, date].sort();
      return { ...prev, dates };
    });
  }, []);

  const reset = useCallback(() => {
    clearState();
    setState({ teamId: null, dates: [] });
  }, []);

  return {
    hydrated,
    teamId: state.teamId,
    dates: state.dates,
    setTeam,
    toggleDate,
    reset,
  };
}
