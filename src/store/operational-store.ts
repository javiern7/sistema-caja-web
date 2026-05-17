import { create } from 'zustand';

export type OperationalContext = {
  id: string;
  name: string;
  kind: 'negocio' | 'evento';
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
  setActiveContext: (context: OperationalContext) => void;
  openDemoCash: () => void;
  closeDemoCash: () => void;
  clearOperationalState: () => void;
};

const demoContexts: OperationalContext[] = [
  { id: 'ctx-001', name: 'Tienda Principal', kind: 'negocio' },
  { id: 'ctx-002', name: 'Evento de Fin de Semana', kind: 'evento' },
];

export const useOperationalStore = create<OperationalState>((set) => ({
  availableContexts: demoContexts,
  activeContext: null,
  activeCash: null,
  setActiveContext: (context) => set({ activeContext: context }),
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
  clearOperationalState: () => set({ activeContext: null, activeCash: null }),
}));
