export interface ParsedXmlItem {
  code: string
  name: string
  ncm: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

function extractTag(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = content.match(regex)
  return m ? m[1].trim() : ''
}

export function parseNfeXml(xml: string): ParsedXmlItem[] {
  const clean = xml
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/xmlns[^=]*="[^"]*"/g, '')
    .replace(/>\s+</g, '><')

  // Support both <NFe> and multiple <nfeProc>/<NFe> structures
  const nfeRegex = /<NFe[^>]*>([\s\S]*?)<\/NFe>/gi
  let allItems: ParsedXmlItem[] = []

  let nfeMatch: RegExpExecArray | null
  while ((nfeMatch = nfeRegex.exec(clean)) !== null) {
    const nfeContent = nfeMatch[1]
    const infNfe = extractTag(nfeContent, 'infNFe')
    if (!infNfe) continue

    const detRegex = /<det[^>]*>([\s\S]*?)<\/det>/gi
    let detMatch: RegExpExecArray | null

    while ((detMatch = detRegex.exec(infNfe)) !== null) {
      const detContent = detMatch[1]
      const prod = extractTag(detContent, 'prod')
      if (!prod) continue

      const name = extractTag(prod, 'xProd')
      if (!name) continue

      const code = extractTag(prod, 'cProd')
      const ncm = extractTag(prod, 'NCM')
      const unit = extractTag(prod, 'uCom')
      const qCom = extractTag(prod, 'qCom')
      const vUnCom = extractTag(prod, 'vUnCom')
      const vProd = extractTag(prod, 'vProd')

      allItems.push({
        code,
        name,
        ncm,
        unit,
        quantity: parseFloat(qCom.replace(',', '.')) || 0,
        unitPrice: parseFloat(vUnCom.replace(',', '.')) || 0,
        totalPrice: parseFloat(vProd.replace(',', '.')) || 0,
      })
    }
  }

  return allItems
}
