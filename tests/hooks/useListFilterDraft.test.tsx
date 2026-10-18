import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useListFilterDraft } from '../../src/hooks/useListFilterDraft';

describe('useListFilterDraft', () => {
  it('keeps edits local until submit and returns trimmed applied values', () => {
    const { result } = renderHook(() => useListFilterDraft('', {}));

    expect(result.current.dirty).toBe(false);
    act(() => result.current.setKeyword('  星云  '));
    act(() => result.current.setFilter('status', 'active'));
    expect(result.current.dirty).toBe(true);
    expect(result.current.keyword).toBe('  星云  ');

    let submitted: { keyword: string; filters: Record<string, string> } | undefined;
    act(() => {
      submitted = result.current.submit();
    });
    expect(submitted).toEqual({ keyword: '星云', filters: { status: 'active' } });
    expect(result.current.dirty).toBe(false);
  });

  it('syncs from URL changes and preserves unsubmitted edits when unrelated URL state changes', () => {
    const { result, rerender } = renderHook(
      ({ keyword, filters }: { keyword: string; filters: Record<string, string> }) =>
        useListFilterDraft(keyword, filters),
      { initialProps: { keyword: '', filters: {} } },
    );

    act(() => result.current.setKeyword('draft'));
    expect(result.current.dirty).toBe(true);

    // Same filter signature (e.g. only page/sort changed): draft survives.
    rerender({ keyword: '', filters: {} });
    expect(result.current.keyword).toBe('draft');
    expect(result.current.dirty).toBe(true);

    // URL filter signature actually changed (back/forward or another page action).
    rerender({ keyword: 'applied', filters: { status: 'active' } });
    expect(result.current.keyword).toBe('applied');
    expect(result.current.filters).toEqual({ status: 'active' });
    expect(result.current.dirty).toBe(false);
  });

  it('resets filters and keyword together', () => {
    const { result } = renderHook(() => useListFilterDraft('applied', { status: 'active' }));
    act(() => result.current.setKeyword('draft'));
    act(() => result.current.setFilters({ status: undefined, industry: '金融' }));
    act(() => result.current.reset());

    expect(result.current.keyword).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.dirty).toBe(false);
  });
});
