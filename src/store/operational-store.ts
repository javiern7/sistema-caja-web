import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CashBoxDto, OperationalContextDto } from '../services/api/types';
import { OPERATIONAL_STORAGE_KEY } from './storage';

export type OperationalContext = {
  id: string;
  name: string;
  kind: 'negocio' | 'evento';
  status: string;
};

export type CashSession = {
  id: string;
  operationalContextId: string;
  operationalContextName?: string;
  openingAmount: number;
  totalSales: number;
  additionalIncome: number;
  totalExpenses: number;
  expectedAmount: number;
  countedAmount?: number | null;
  differenceAmount?: number | null;
  openingObservation?: string;
  closingObservation?: string;
  openedAt?: string;
  closedAt?: string;
  closedByUsername?: string;
  openedByUsername?: string;
  status: 'ABIERTA' | 'CERRADA';
  movements: Array<{
    id: string;
    movementType: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    performedBy?: string;
    occurredAt?: string;
    observation?: string;
  }>;
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

function normalizeCashStatus(status?: string) {
  return status === 'CERRADA' ? 'CERRADA' : 'ABIERTA';
}

export function normalizeCashBox(cash: CashBoxDto): CashSession {
  return {
    id: String(cash.id),
    operationalContextId: String(cash.operationalContextId),
    operationalContextName: cash.operationalContextName,
    openingAmount: Number(cash.openingAmount ?? 0),
    totalSales: Number(cash.totalSales ?? 0),
    additionalIncome: Number(cash.additionalIncome ?? 0),
    totalExpenses: Number(cash.totalExpenses ?? 0),
    expectedAmount: Number(cash.expectedAmount ?? 0),
    countedAmount: cash.countedAmount ?? null,
    differenceAmount: cash.differenceAmount ?? null,
    openingObservation: cash.openingObservation,
    closingObservation: cash.closingObservation,
    openedAt: cash.openedAt,
    closedAt: cash.closedAt,
    closedByUsername: cash.closedByUsername,
    openedByUsername: cash.openedByUsername,
    status: normalizeCashStatus(cash.status),
    movements: (cash.movements ?? []).map((movement) => ({
      id: String(movement.id),
      movementType: movement.movementType,
      amount: Number(movement.amount ?? 0),
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      performedBy: movement.performedBy,
      occurredAt: movement.occurredAt,
      observation: movement.observation,
    })),
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
      openDemoCash: () => set({ activeCash: null }),
      closeDemoCash: () => set({ activeCash: null }),
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
