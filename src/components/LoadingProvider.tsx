import React from "react";
import { Backdrop, CircularProgress } from "@mui/material";

type LoadingContextValue = {
  start: () => void;
  stop: () => void;
  isLoading: boolean;
};

const LoadingContext = React.createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = React.useState(0);

  const start = React.useCallback(() => setCount((c) => c + 1), []);
  const stop = React.useCallback(
    () => setCount((c) => Math.max(0, c - 1)),
    [],
  );
  const value = React.useMemo(
    () => ({ start, stop, isLoading: count > 0 }),
    [start, stop, count],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = React.useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
}

export function GlobalLoading() {
  const { isLoading } = useLoading();
  if (!isLoading) return null;
  return (
    <Backdrop
      open
      sx={{ zIndex: 2000, color: "white", bgcolor: "rgba(0,0,0,0.25)" }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
