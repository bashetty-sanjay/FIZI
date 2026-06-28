/**
 * Utility functions for height unit conversions
 */

/**
 * Convert centimeters to formatted feet string (e.g. 5'11")
 */
export const cmToFeet = (cm: number): string => {
    if (!cm || isNaN(cm)) return '';
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
};

/**
 * Convert formatted feet string (5'11") to centimeters
 */
export const feetToCm = (feetStr: string): number => {
    if (!feetStr) return 0;

    // Parse format like 5'11" or 5.11
    const parts = feetStr.split(/['.]/);
    if (parts.length === 0) return 0;

    const feet = parseInt(parts[0], 10) || 0;
    const inchesStr = parts[1] ? parts[1].replace('"', '') : '0';
    const inches = parseInt(inchesStr, 10) || 0;

    return Math.round((feet * 12 + inches) * 2.54);
};

/**
 * Convert centimeters to meters
 */
export const cmToMeters = (cm: number): number => {
    if (!cm || isNaN(cm)) return 0;
    return parseFloat((cm / 100).toFixed(2));
};

/**
 * Convert meters to centimeters
 */
export const metersToCm = (meters: number): number => {
    if (!meters || isNaN(meters)) return 0;
    return Math.round(meters * 100);
};

/**
 * Format height for display based on unit
 */
export const formatHeight = (cm: number, unit: 'cm' | 'ft' | 'm'): string => {
    if (!cm) return '--';

    switch (unit) {
        case 'ft':
            return cmToFeet(cm);
        case 'm':
            return `${cmToMeters(cm)} m`;
        case 'cm':
        default:
            return `${cm} cm`;
    }
};
