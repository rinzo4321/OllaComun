
import { OllaLocation } from './types';

export const INITIAL_OLLAS: OllaLocation[] = [
  {
    id: 'sjl',
    name: 'Olla Común "Manos Solidarias"',
    coords: [-12.00, -76.95],
    surplus: [
      { product: 'Papa', quantity: 0, unit: 'kg' },
      { product: 'Arroz', quantity: 0, unit: 'kg' }
    ],
    deficit: [
      { product: 'Pollo', quantity: 0, unit: 'kg' },
      { product: 'Lentejas', quantity: 0, unit: 'kg' }
    ]
  },
  {
    id: 'ves',
    name: 'Olla Común "Villa Sabor"',
    coords: [-12.16, -76.93],
    surplus: [
      { product: 'Pollo', quantity: 0, unit: 'kg' },
      { product: 'Fideos', quantity: 0, unit: 'kg' }
    ],
    deficit: [
      { product: 'Papa', quantity: 0, unit: 'kg' },
      { product: 'Aceite', quantity: 0, unit: 'litros' }
    ]
  },
  {
    id: 'comas',
    name: 'Olla Común "Unión y Sabor"',
    coords: [-11.93, -77.04],
    surplus: [
      { product: 'Lentejas', quantity: 0, unit: 'kg' },
      { product: 'Verduras', quantity: 0, unit: 'kg' }
    ],
    deficit: [
      { product: 'Arroz', quantity: 0, unit: 'kg' },
      { product: 'Pollo', quantity: 0, unit: 'kg' }
    ]
  }
];

export const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];