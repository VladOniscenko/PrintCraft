const rawCurrencyCode =
  (import.meta.env.VITE_CURRENCY_CODE as string | undefined) || "EUR";

export const CURRENCY_CODE = (() => {
  const normalized = rawCurrencyCode.trim().toUpperCase();
  return normalized.length === 3 ? normalized : "EUR";
})();

export function formatCurrencyAmount(amount: number, digits = 2): string {
  return `${CURRENCY_CODE} ${Number(amount || 0).toFixed(digits)}`;
}
