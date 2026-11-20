export type SalesProduct = {
  id: string;
  name: string;
  volume: string;
};

export type SalesFamily = {
  id: string;
  category: string;
  name: string;
  products: SalesProduct[];
};

export type SalesCategory = {
  id: string;
  name: string;
  families: SalesFamily[];
};

export type SalesSlide = {
  id: string;
  category: string;
  family: string;
  products: SalesProduct[];
};

const standardVolumes = ['2000 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'];
export const salesProductImage = 'assets/products/spirits-bottle.svg';

function createFamily(
  id: string,
  category: string,
  name: string,
  productName: string,
  volumes: string[],
): SalesFamily {
  return {
    id,
    category,
    name,
    products: volumes.map((volume, index) => ({
      id: `${id}-${index}`,
      name: productName,
      volume,
    })),
  };
}

export const salesFamilies: SalesFamily[] = [
  createFamily(
    'antioqueno-verde',
    'Aguardiente',
    'Antioqueño 24° Sin Azúcar (Verde)',
    'Antioqueño 24° Sin Azúcar (Verde)',
    ['1750 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'],
  ),
  createFamily(
    'antioqueno-azul',
    'Aguardiente',
    'Antioqueño Sin Azúcar (Azul)',
    'Antioqueño Sin Azúcar (Azul)',
    standardVolumes,
  ),
  createFamily(
    'antioqueno-rojo',
    'Aguardiente',
    'Antioqueño Tradicional (Rojo)',
    'Antioqueño Tradicional (Rojo) joven',
    standardVolumes,
  ),
  createFamily(
    'antioqueno-real',
    'Aguardiente',
    'Antioqueño Real Sin Azúcar (Premium)',
    'Antioqueño Real Sin Azúcar (Premium)',
    ['750 ml'],
  ),
  createFamily('ron-dorado', 'Ron', 'Ron Medellín Dorado', 'Ron Medellín Dorado', ['750 ml', '375 ml']),
  createFamily('ron-3 Años', 'Ron', 'Ron Medellín Añejo 3 Años', 'Ron Medellín Añejo 3 años', standardVolumes),
  createFamily(
    'ron-5-anos',
    'Ron especializado',
    'Ron Medellín 5 años Extra Añejo',
    'Ron Medellín 5 años Extra Añejo',
    ['750 ml', '375 ml'],
  ),
  createFamily(
    'ron-8-anos',
    'Ron especializado',
    'Ron Medellín 8 años Extra Añejo Reserva Especial',
    'Ron Medellín 8 años Extra Añejo Reserva Especial',
    ['750 ml', '375 ml'],
  ),
  createFamily(
    'ron-12-anos',
    'Ron especializado',
    'Ron Medellín 12 años Gran Reserva',
    'Ron Medellín 12 años Gran Reserva',
    ['750 ml'],
  ),
  createFamily(
    'ron-19-anos',
    'Ron especializado',
    'Ron Medellín 19 años Gran Solera',
    'Ron Medellín 19 años Gran Solera',
    ['750 ml'],
  ),
];

export const salesCategories: SalesCategory[] = ['Aguardiente', 'Ron', 'Ron especializado'].map((name) => ({
  id: name.toLowerCase().replaceAll(' ', '-'),
  name,
  families: salesFamilies.filter((family) => family.category === name),
}));

const specializedFamilies = salesFamilies.filter((family) => family.category === 'Ron especializado');

export const salesSlides: SalesSlide[] = [
  ...salesFamilies
    .filter((family) => family.category !== 'Ron especializado')
    .map((family) => ({
      id: family.id,
      category: family.category,
      family: family.name,
      products: family.products,
    })),
  {
    id: 'ron-especializado',
    category: 'Ron de especialidad',
    family: 'Ron Medellín Especializado',
    products: specializedFamilies.flatMap((family) => family.products),
  },
];
