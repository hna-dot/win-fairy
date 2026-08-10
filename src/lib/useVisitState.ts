"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { clearState, loadState, saveState, type StoredState } from "./storage";

// 초기 state는 서버/클라이언트 첫 렌더 모두 동일한 상수라 하이드레이션 불일치가 없다.
// useLayoutEffect(클라이언트 전용)로 페인트 전에 localStorage를 복원해, 화면 깜빡임 없이
// SSR 결과물(크롤러가 보는 실제 콘텐츠)은 그대로 유지하면서 저장된 선택값만 조용히 채운다.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useVisitState() {
  const [state, setState] = useState<StoredState>({ teamId: null, dates: [] });
  const [hydrated, setHydrated] = useState(false);

  useIsomorphicLayoutEffect(() => {
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
