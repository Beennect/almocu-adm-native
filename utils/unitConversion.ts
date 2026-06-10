export interface ConversionInfo {
  needsInput: boolean
  factor?: number
  question?: string
}

const DIRECT_MAP: Record<string, string> = {
  'KG': 'Kg',
  'L': 'Litros',
  'LT': 'Litros',
  'UN': 'Unidades',
  'MT': 'Unidades',
  'PC': 'Unidades',
  'MIL': 'Unidades',
}

const METRIC_CONVERSIONS: Record<string, { target: string; factor: number }> = {
  'GR': { target: 'Kg', factor: 0.001 },
  'MG': { target: 'Kg', factor: 0.000001 },
  'G': { target: 'Kg', factor: 0.001 },
  'ML': { target: 'Litros', factor: 0.001 },
  'TON': { target: 'Kg', factor: 1000 },
  'T': { target: 'Kg', factor: 1000 },
  'M3': { target: 'Litros', factor: 1000 },
}

const SYSTEM_UNITS = ['Kg', 'Litros', 'Unidades']

export function getConversionInfo(xmlUnit: string, targetUnit: string): ConversionInfo {
  const xml = xmlUnit.toUpperCase().trim()
  const target = targetUnit.trim()

  if (!xml || !target) return { needsInput: false }
  if (xml.toUpperCase() === target.toUpperCase()) return { needsInput: false }

  const direct = DIRECT_MAP[xml]
  if (direct === target) return { needsInput: false }

  const metric = METRIC_CONVERSIONS[xml]
  if (metric && metric.target === target) {
    return { needsInput: false, factor: metric.factor }
  }

  return {
    needsInput: true,
    question: `Cada ${xmlUnit} tem quantos ${targetUnit}?`,
  }
}

export function applyConversion(
  quantity: number,
  unitPrice: number,
  factor: number,
): { convertedQuantity: number; convertedUnitPrice: number } {
  return {
    convertedQuantity: quantity * factor,
    convertedUnitPrice: unitPrice / factor,
  }
}

export function isSystemUnit(unit: string): boolean {
  return SYSTEM_UNITS.includes(unit)
}
