
// Constants for roulette strategies and number groups
export const strategies = [
  { name: 'Pares de Cor', numbers: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36], color: "bg-purple-600" },
  { name: 'Terminal 1,2,3', numbers: [1, 2, 3, 11, 12, 13, 21, 22, 23, 31, 32, 33], color: "bg-blue-600" },
  { name: 'Terminal 4,7,8', numbers: [4, 7, 8, 14, 17, 18, 24, 27, 28, 34], color: "bg-emerald-600" },
  { name: 'Terminal 5,9,6', numbers: [5, 9, 6, 15, 16, 19, 25, 26, 29, 35], color: "bg-amber-600" },
  { name: 'Terminal 3,6,9', numbers: [3, 6, 9, 13, 16, 19, 23, 26, 29, 33, 36], color: "bg-rose-600" },
];

export const numberGroups = {
  "grupo-123": { name: "Grupo 123", numbers: [1, 2, 3], color: "bg-blue-600 text-white" },
  "grupo-478": { name: "Grupo 478", numbers: [4, 7, 8], color: "bg-emerald-600 text-white" },
  "grupo-596": { name: "Grupo 596", numbers: [5, 9, 6], color: "bg-amber-600 text-white" },
  "grupo-693": { name: "Grupo 693", numbers: [6, 9, 3], color: "bg-rose-600 text-white" },
};
