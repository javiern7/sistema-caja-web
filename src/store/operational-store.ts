import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OperationalContextDto } from '../services/api/types';
import { OPERATIONAL_STORAGE_KEY } from './storage';

export type OperationalContext = {
  id: string;
  name: string;
  kind: 'negocio' | 'evento';
  status: string;
};

export type CashSession = {
  id: string;
  openingAmount: number;
  status: 'open' | 'closed';
};

type OperationalState = {
  availableContexts: OperationalContext[];
  activeContext: OperationalContext | null;
  activeCash: CashSession | null;
  setAvailableContexts: (contexts: OperationalContextDto[]) => void;
  setActiveContext: (context: OperationalContext) => void;
  setActiveCash: (cash: CashSession | null) => void;
  openDemoCash: () => void;
  closeDemoCash: () => void;
  clearOperationalState: () => void;
};

function normalizeContextKind(input?: string) {
  const value = input?.toLowerCase();
  return value === 'evento' ? 'evento' : 'negocio';
}

function normalizeContext(context: OperationalContextDto): OperationalContext {
  return {
    id: String(context.id),
    name: context.name ?? context.nombre ?? `Contexto ${context.id}`,
    kind: normalizeContextKind(context.kind ?? context.tipo),
    status: context.status ?? context.estado ?? 'ACTIVO',
  };
}

export const useOperationalStore = create<OperationalState>()(
  persist(
    (set) => ({
      availableContexts: [],
      activeContext: null,
      activeCash: null,
      setAvailableContexts: (contexts) =>
        set((state) => {
          const normalizedContexts = contexts.map(normalizeContext);
          const activeContext =
            normalizedContexts.find((context) => context.id === state.activeContext?.id) ?? state.activeContext;

          return {
            availableContexts: normalizedContexts,
            activeContext: activeContext ?? null,
          };
        }),
      setActiveContext: (context) => set({ activeContext: context }),
      setActiveCash: (cash) => set({ activeCash: cash }),
      openDemoCash: () =>
        set({
          activeCash: {
            id: 'cash-001',
            openingAmount: 250,
            status: 'open',
          },
        }),
      closeDemoCash: () =>
        set((state) => ({
          activeCash: state.activeCash ? { ...state.activeCash, status: 'closed' } : null,
        })),
      clearOperationalState: () => set({ availableContexts: [], activeContext: null, activeCash: null }),
    }),
    {
      name: OPERATIONAL_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeContext: state.activeContext,
        activeCash: state.activeCash,
      }),
    },
  ),
);
