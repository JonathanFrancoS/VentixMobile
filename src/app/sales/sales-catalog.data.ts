export type SalesProduct = {
  id: string;
  name: string;
  volume: string;
  image: string;
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
const productImages = {
  verde: '/assets/products/antioqueno-verde.svg',
  azul: '/assets/products/antioqueno-azul.svg',
  tradicional: '/assets/products/antioqueno-rojo.svg',
  premium: '/assets/products/antioqueno-premium.svg',
  ronDorado: '/assets/products/ron-dorado.svg',
  ronAnejo: '/assets/products/ron-anejo-3.svg',
  ronEspecializado: '/assets/products/ron-especializado.svg',
};

function createFamily(
  id: string,
  category: string,
  name: string,
  productName: string,
  volumes: string[],
  image: string,
): SalesFamily {
  return {
    id,
    category,
    name,
    products: volumes.map((volume, index) => ({
      id: `${id}-${index}`,
      name: productName,
      volume,
      image,
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
    productImages.verde,
  ),
  createFamily(
    'antioqueno-azul',
    'Aguardiente',
    'Antioqueño Sin Azúcar (Azul)',
    'Antioqueño Sin Azúcar (Azul)',
    standardVolumes,
    productImages.azul,
  ),
  createFamily(
    'antioqueno-rojo',
    'Aguardiente',
    'Antioqueño Tradicional (Rojo)',
    'Antioqueño Tradicional (Rojo) joven',
    standardVolumes,
    productImages.tradicional,
  ),
  createFamily(
    'antioqueno-real',
    'Aguardiente',
    'Antioqueño Real Sin Azúcar (Premium)',
    'Antioqueño Real Sin Azúcar (Premium)',
    ['750 ml'],
    productImages.premium,
  ),
  createFamily(
    'ron-dorado',
    'Ron',
    'Ron Medellín Dorado',
    'Ron Medellín Dorado',
    ['750 ml', '375 ml'],
    productImages.ronDorado,
  ),
  createFamily(
    'ron-3 Años',
    'Ron',
    'Ron Medellín Añejo 3 Años',
    'Ron Medellín Añejo 3 años',
    standardVolumes,
    productImages.ronAnejo,
  ),
  createFamily(
    'ron-5-anos',
    'Ron especializado',
    'Ron Medellín 5 años Extra Añejo',
    'Ron Medellín 5 años Extra Añejo',
    ['750 ml', '375 ml'],
    productImages.ronEspecializado,
  ),
  createFamily(
    'ron-8-anos',
    'Ron especializado',
    'Ron Medellín 8 años Extra Añejo Reserva Especial',
    'Ron Medellín 8 años Extra Añejo Reserva Especial',
    ['750 ml', '375 ml'],
    productImages.ronEspecializado,
  ),
  createFamily(
    'ron-12-anos',
    'Ron especializado',
    'Ron Medellín 12 años Gran Reserva',
    'Ron Medellín 12 años Gran Reserva',
    ['750 ml'],
    productImages.ronEspecializado,
  ),
  createFamily(
    'ron-19-anos',
    'Ron especializado',
    'Ron Medellín 19 años Gran Solera',
    'Ron Medellín 19 años Gran Solera',
    ['750 ml'],
    productImages.ronEspecializado,
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
