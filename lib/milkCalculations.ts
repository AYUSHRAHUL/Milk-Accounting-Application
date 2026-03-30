/**
 * Milk Quality Calculation Utilities
 */

// Correction Table: Temperature (19-35) x Fat Range (0-10)
// Row Key: String(Temperature_0.5)
// Col: [0-1.99, 2-3.99, 4-5.99, 6-7.99, 8-9.99]
const CORRECTION_TABLE: Record<string, number[]> = {
  "19.0": [-2.2, -2.4, -2.6, -2.7, -2.9],
  "19.5": [-2.1, -2.3, -2.4, -2.6, -2.7],
  "20.0": [-2.0, -2.1, -2.2, -2.4, -2.5],
  "20.5": [-1.8, -2.0, -2.1, -2.2, -2.3],
  "21.0": [-1.7, -1.8, -1.9, -2.0, -2.2],
  "21.5": [-1.5, -1.7, -1.7, -1.9, -2.0],
  "22.0": [-1.4, -1.5, -1.6, -1.7, -1.8],
  "22.5": [-1.3, -1.4, -1.4, -1.5, -1.6],
  "23.0": [-1.1, -1.2, -1.3, -1.4, -1.4],
  "23.5": [-1.0, -1.1, -1.1, -1.2, -1.3],
  "24.0": [-0.8, -0.9, -1.0, -1.0, -1.1],
  "24.5": [-0.7, -0.8, -0.8, -0.9, -0.9],
  "25.0": [-0.6, -0.6, -0.6, -0.7, -0.7],
  "25.5": [-0.4, -0.5, -0.5, -0.5, -0.5],
  "26.0": [-0.3, -0.3, -0.3, -0.3, -0.4],
  "26.5": [-0.1, -0.2, -0.2, -0.2, -0.2],
  "27.0": [0.0, 0.0, 0.0, 0.0, 0.0],
  "27.5": [0.1, 0.2, 0.2, 0.2, 0.2],
  "28.0": [0.3, 0.3, 0.3, 0.3, 0.4],
  "28.5": [0.4, 0.5, 0.5, 0.5, 0.5],
  "29.0": [0.6, 0.6, 0.6, 0.7, 0.7],
  "29.5": [0.7, 0.8, 0.8, 0.9, 0.9],
  "30.0": [0.8, 0.9, 1.0, 1.0, 1.1],
  "30.5": [1.0, 1.1, 1.1, 1.2, 1.3],
  "31.0": [1.1, 1.2, 1.3, 1.4, 1.4],
  "31.5": [1.3, 1.4, 1.4, 1.5, 1.6],
  "32.0": [1.4, 1.5, 1.6, 1.7, 1.8],
  "32.5": [1.5, 1.7, 1.7, 1.9, 2.0],
  "33.0": [1.7, 1.8, 1.9, 2.0, 2.2],
  "33.5": [1.8, 2.0, 2.1, 2.2, 2.3],
  "34.0": [2.0, 2.1, 2.2, 2.4, 2.5],
  "34.5": [2.1, 2.3, 2.4, 2.6, 2.7],
  "35.0": [2.2, 2.4, 2.6, 2.7, 2.9],
};

/**
 * Calculates the Correction Factor to be added to the Observed Lactometer Reading (LR)
 * @param temp - Temperature in Celsius
 * @param fat - Fat percentage
 * @returns Corrected LR (CLR) = Observed LR + Correction
 */
export function getCLRCorrection(temp: number, fat: number): number {
  // Round temperature to nearest 0.5 increment
  let roundedTemp = Math.round(temp * 2) / 2;

  // Clamp temperature to table range [19.0, 35.0]
  if (roundedTemp < 19.0) roundedTemp = 19.0;
  if (roundedTemp > 35.0) roundedTemp = 35.0;

  const tempKey = roundedTemp.toFixed(1);
  const row = CORRECTION_TABLE[tempKey];

  if (!row) return 0;

  // Range-based fat column index
  let fatCol = 0;
  if (fat >= 8.0) fatCol = 4;
  else if (fat >= 6.0) fatCol = 3;
  else if (fat >= 4.0) fatCol = 2;
  else if (fat >= 2.0) fatCol = 1;

  return row[fatCol];
}
