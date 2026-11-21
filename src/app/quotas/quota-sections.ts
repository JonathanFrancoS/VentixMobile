import { salesFamilies, type SalesFamily } from '../sales/sales-catalog.data';

export type QuotaSection = {
  id: 'aguardiente' | 'ron';
  name: string;
  families: SalesFamily[];
};

export const quotaSections: QuotaSection[] = [
  {
    id: 'aguardiente',
    name: 'Aguardientes',
    families: salesFamilies.filter((family) => family.category === 'Aguardiente'),
  },
  {
    id: 'ron',
    name: 'Rones',
    families: salesFamilies.filter((family) => family.category !== 'Aguardiente'),
  },
];
