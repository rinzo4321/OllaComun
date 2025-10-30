
import { OllaLocation } from './types';

export const INITIAL_OLLAS: OllaLocation[] = [
  {
    id: 'sjl',
    name: 'Olla Común "Manos Solidarias"',
    coords: [-12.00, -76.95],
    surplus: ['Papa', 'Arroz'],
    deficit: ['Pollo', 'Lentejas']
  },
  {
    id: 'ves',
    name: 'Olla Común "Villa Sabor"',
    coords: [-12.16, -76.93],
    surplus: ['Pollo', 'Fideos'],
    deficit: ['Papa', 'Aceite']
  },
  {
    id: 'comas',
    name: 'Olla Común "Unión y Sabor"',
    coords: [-11.93, -77.04],
    surplus: ['Lentejas', 'Verduras'],
    deficit: ['Arroz', 'Pollo']
  }
];

export const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];