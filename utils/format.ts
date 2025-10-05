

/**
 * Formats a number as Argentine Peso currency.
 * @param n - The number to format.
 * @returns A string representing the formatted currency, e.g., "$ 1.234,50".
 */
export const formatARS = (n: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(n);
};

/**
 * Formats an ISO date string into a readable local date and time.
 * @param isoString - The ISO date string to format.
 * @returns A formatted string, e.g., "25/12/2024, 14:30:05".
 */
export const formatDateTime = (isoString: string): string => {
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(date);
    } catch (error) {
        return "Fecha inválida";
    }
};