import { useCallback, useEffect, useRef, useState } from 'react';

export interface ListFilterValues {
  keyword: string;
  filters: Record<string, string>;
}

export function useListFilterDraft(
  urlKeyword: string,
  urlFilters: Record<string, string>,
): {
  keyword: string;
  filters: Record<string, string>;
  dirty: boolean;
  setKeyword: (value: string) => void;
  setFilter: (key: string, value: string | undefined) => void;
  setFilters: (values: Record<string, string | undefined>) => void;
  submit: () => ListFilterValues;
  reset: () => void;
} {
  const signature = `${urlKeyword}|${JSON.stringify(urlFilters)}`;
  const lastSignature = useRef(signature);
  const [keyword, setKeywordState] = useState(urlKeyword);
  const [filters, setFiltersState] = useState<Record<string, string>>(() => ({ ...urlFilters }));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    setKeywordState(urlKeyword);
    setFiltersState({ ...urlFilters });
    setDirty(false);
  }, [signature, urlFilters, urlKeyword]);

  const setKeyword = useCallback((value: string) => {
    setKeywordState(value);
    setDirty(true);
  }, []);

  const setFilter = useCallback((key: string, value: string | undefined) => {
    setFiltersState((current) => {
      const next = { ...current };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    setDirty(true);
  }, []);

  const setFilters = useCallback((values: Record<string, string | undefined>) => {
    setFiltersState((current) => {
      const next = { ...current };
      Object.entries(values).forEach(([key, value]) => {
        if (value) next[key] = value;
        else delete next[key];
      });
      return next;
    });
    setDirty(true);
  }, []);

  const submit = useCallback((): ListFilterValues => {
    const values = { keyword: keyword.trim(), filters: { ...filters } };
    setKeywordState(values.keyword);
    setDirty(false);
    return values;
  }, [filters, keyword]);

  const reset = useCallback(() => {
    setKeywordState('');
    setFiltersState({});
    setDirty(false);
  }, []);

  return { keyword, filters, dirty, setKeyword, setFilter, setFilters, submit, reset };
}
