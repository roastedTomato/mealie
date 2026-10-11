import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api/http";
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    setLoading(!!path);
    if (path)
      api
        .get<T>(path, controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setData(value);
        })
        .catch((reason: unknown) => {
          if (!controller.signal.aborted) setError(errorMessage(reason));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    return () => controller.abort();
  }, [path, revision]);
  return { data, setData, error, loading, reload };
}
