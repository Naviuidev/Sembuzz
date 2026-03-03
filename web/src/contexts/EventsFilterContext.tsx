import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface EventsFilterState {
  selectedCategoryId: string | null;
  selectedCategoryName: string | null;
  selectedSubCategoryIds: string[];
  selectedSubCategoryNames: string[];
  searchQuery: string;
}

const defaultState: EventsFilterState = {
  selectedCategoryId: null,
  selectedCategoryName: null,
  selectedSubCategoryIds: [],
  selectedSubCategoryNames: [],
  searchQuery: '',
};

type SetCategory = (id: string | null, name: string | null) => void;
type SetSubCategories = (ids: string[], names: string[]) => void;

interface EventsFilterContextValue extends EventsFilterState {
  setSelectedCategory: SetCategory;
  setSelectedSubCategories: SetSubCategories;
  setSearchQuery: (q: string) => void;
  clearFilters: () => void;
}

const EventsFilterContext = createContext<EventsFilterContextValue | null>(null);

export function EventsFilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EventsFilterState>(defaultState);

  const setSelectedCategory = useCallback<SetCategory>((id, name) => {
    setState((s) => ({
      ...s,
      selectedCategoryId: id,
      selectedCategoryName: name,
      selectedSubCategoryIds: [],
      selectedSubCategoryNames: [],
    }));
  }, []);

  const setSelectedSubCategories = useCallback<SetSubCategories>((ids, names) => {
    setState((s) => ({ ...s, selectedSubCategoryIds: ids, selectedSubCategoryNames: names }));
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setState((s) => ({ ...s, searchQuery: q }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(defaultState);
  }, []);

  const value: EventsFilterContextValue = {
    ...state,
    setSelectedCategory,
    setSelectedSubCategories,
    setSearchQuery,
    clearFilters,
  };

  return (
    <EventsFilterContext.Provider value={value}>
      {children}
    </EventsFilterContext.Provider>
  );
}

export function useEventsFilter() {
  const ctx = useContext(EventsFilterContext);
  return ctx;
}
