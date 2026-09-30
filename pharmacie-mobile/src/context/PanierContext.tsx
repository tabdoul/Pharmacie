import React, { createContext, useContext, useState } from 'react';

export type PanierItem = {
  stockId: number;
  nomDemande: string;
  nomProduit: string;
  formeProduit: string | null;
  prix: number;
  nomPharmacie: string;
  pharmacieId: number;
  ville: string;
  quartier: string | null;
  telephone: string | null;
  achete: boolean;
};

type PanierState = {
  items: PanierItem[];
  ajouter: (item: Omit<PanierItem, 'achete'>) => void;
  retirer: (stockId: number) => void;
  estDansPanier: (stockId: number) => boolean;
  basculerAchete: (stockId: number) => void;
  retirerAchetes: () => void;
  vider: () => void;
};

const PanierContext = createContext<PanierState | undefined>(undefined);

export function PanierProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PanierItem[]>([]);

  const ajouter = (item: Omit<PanierItem, 'achete'>) => {
    setItems((precedent) => {
      if (precedent.some((i) => i.stockId === item.stockId)) return precedent;
      return [...precedent, { ...item, achete: false }];
    });
  };

  const retirer = (stockId: number) => {
    setItems((precedent) => precedent.filter((i) => i.stockId !== stockId));
  };

  const estDansPanier = (stockId: number) => items.some((i) => i.stockId === stockId);

  const basculerAchete = (stockId: number) => {
    setItems((precedent) =>
      precedent.map((i) => (i.stockId === stockId ? { ...i, achete: !i.achete } : i))
    );
  };

  const retirerAchetes = () => {
    setItems((precedent) => precedent.filter((i) => !i.achete));
  };

  const vider = () => setItems([]);

  return (
    <PanierContext.Provider
      value={{ items, ajouter, retirer, estDansPanier, basculerAchete, retirerAchetes, vider }}
    >
      {children}
    </PanierContext.Provider>
  );
}

export function usePanier() {
  const ctx = useContext(PanierContext);
  if (!ctx) {
    throw new Error("usePanier doit etre utilise a l'interieur de PanierProvider");
  }
  return ctx;
}