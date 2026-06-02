export const sanitizeAmountInput = (text: string): string =>
  text.replace(/[^0-9.,]/g, '');

export const parseAmountInput = (text: string): number => {
  if (!text) return NaN;
  const normalized = text.replace(',', '.');
  const value = parseFloat(normalized);
  return value;
};

export const computeStockDelta = (
  currentStock: number,
  sign: 1 | -1,
  rawAmount: number,
  options?: { name?: string; unit?: string },
): { delta: number; error?: string } => {
  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    return { delta: 0, error: 'Informe um valor maior que zero.' };
  }
  if (!Number.isFinite(sign) || (sign !== 1 && sign !== -1)) {
    return { delta: 0, error: 'Operação inválida.' };
  }

  const delta = sign * rawAmount;
  const newStock = (currentStock ?? 0) + delta;

  if (newStock < 0) {
    const label = options?.name ? `"${options.name}"` : 'O item';
    const unit = options?.unit ? ` ${options.unit}` : '';
    return {
      delta: 0,
      error: `Estoque insuficiente: ${label} possui ${currentStock}${unit} em estoque.`,
    };
  }

  return { delta };
};
