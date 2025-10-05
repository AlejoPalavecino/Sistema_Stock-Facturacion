const nextNumberKey = (pos: string): string => `invoice_number_${pos}`;

const formatNumber = (num: number): string => num.toString().padStart(8, '0');

export const getNextInvoiceNumber = (pos: string): string => {
    try {
        const key = nextNumberKey(pos);
        const lastNumberStr = localStorage.getItem(key);
        const lastNumber = lastNumberStr ? parseInt(lastNumberStr, 10) : 0;
        return formatNumber(lastNumber + 1);
    } catch (e) {
        console.error("Failed to get next invoice number", e);
        return formatNumber(1);
    }
};

export const incrementInvoiceNumber = (pos: string): string => {
    try {
        const key = nextNumberKey(pos);
        const currentNumber = parseInt(getNextInvoiceNumber(pos), 10);
        localStorage.setItem(key, currentNumber.toString());
        return formatNumber(currentNumber);
    } catch (e) {
        console.error("Failed to increment invoice number", e);
        // Fallback to avoid breaking the flow
        const fallback = Date.now() % 100000000;
        return formatNumber(fallback);
    }
};

const getYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
}

const nextExpedienteKey = (): string => {
    const today = getYYYYMMDD(new Date());
    return `expediente_number_${today}`;
};

const formatExpedienteNumber = (num: number): string => num.toString().padStart(5, '0');

export const generateNextExpediente = (): string => {
    try {
        const key = nextExpedienteKey();
        const todayStr = getYYYYMMDD(new Date());

        const lastNumberStr = localStorage.getItem(key);
        const lastNumber = lastNumberStr ? parseInt(lastNumberStr, 10) : 0;
        const nextNumber = lastNumber + 1;
        
        localStorage.setItem(key, nextNumber.toString());
        
        return `EXP-${todayStr}-${formatExpedienteNumber(nextNumber)}`;
    } catch (e) {
        console.error("Failed to generate next expediente number", e);
        const fallback = Date.now() % 100000;
        return `EXP-${getYYYYMMDD(new Date())}-${formatExpedienteNumber(fallback)}`;
    }
};