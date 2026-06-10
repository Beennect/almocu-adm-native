const NCM_CHAPTER_MAP: Record<string, string> = {
  '01': 'Outra',
  '02': 'Carnes',
  '03': 'Carnes',
  '04': 'Laticínios',
  '05': 'Outra',
  '06': 'Outra',
  '07': 'Conservas',
  '08': 'Conservas',
  '09': 'Temperos',
  '10': 'Grãos',
  '11': 'Massas',
  '12': 'Outra',
  '13': 'Outra',
  '14': 'Outra',
  '15': 'Óleos',
  '16': 'Carnes',
  '17': 'Caixa',
  '18': 'Caixa',
  '19': 'Massas',
  '20': 'Conservas',
  '21': 'Temperos',
  '22': 'Bebidas',
  '23': 'Outra',
  '24': 'Outra',
  '25': 'Outra',
  '26': 'Outra',
  '27': 'Outra',
  '28': 'Outra',
  '29': 'Outra',
  '30': 'Outra',
  '31': 'Outra',
  '32': 'Outra',
  '33': 'Caixa',
  '34': 'Caixa',
  '35': 'Outra',
  '36': 'Outra',
  '37': 'Outra',
  '38': 'Caixa',
  '39': 'Caixa',
  '40': 'Outra',
  '41': 'Outra',
  '42': 'Outra',
  '43': 'Outra',
  '44': 'Outra',
  '45': 'Outra',
  '46': 'Outra',
  '47': 'Outra',
  '48': 'Caixa',
  '49': 'Outra',
  '63': 'Caixa',
  '64': 'Outra',
  '65': 'Outra',
  '68': 'Outra',
  '69': 'Caixa',
  '70': 'Caixa',
  '71': 'Outra',
  '72': 'Outra',
  '73': 'Caixa',
  '74': 'Outra',
  '76': 'Caixa',
  '78': 'Outra',
  '79': 'Outra',
  '80': 'Outra',
  '81': 'Outra',
  '82': 'Caixa',
  '83': 'Outra',
  '84': 'Caixa',
  '85': 'Caixa',
  '87': 'Outra',
  '90': 'Outra',
  '94': 'Outra',
  '95': 'Outra',
  '96': 'Outra',
}

const NCM_HEADING_OVERRIDES: Record<string, string> = {
  // Coffee, tea, maté
  '0901': 'Bebidas',
  '0902': 'Bebidas',

  // Alcoholic beverages
  '2201': 'Bebidas',
  '2202': 'Bebidas',
  '2203': 'Bebidas',
  '2204': 'Bebidas',
  '2205': 'Bebidas',
  '2206': 'Bebidas',
  '2207': 'Bebidas',
  '2208': 'Bebidas',
  '2209': 'Bebidas',

  // Oils
  '1507': 'Óleos',
  '1508': 'Óleos',
  '1509': 'Óleos',
  '1510': 'Óleos',
  '1511': 'Óleos',
  '1512': 'Óleos',
  '1513': 'Óleos',
  '1514': 'Óleos',
  '1515': 'Óleos',
  '1516': 'Óleos',
  '1517': 'Óleos',
  '1518': 'Óleos',

  // Dried legumes: beans, lentils, chickpeas, peas
  '0713': 'Grãos',
  '0714': 'Conservas',

  // Oil seeds: soy, peanuts, sunflower
  '1201': 'Óleos',
  '1202': 'Óleos',
  '1203': 'Óleos',
  '1204': 'Óleos',
  '1205': 'Óleos',
  '1206': 'Óleos',
  '1207': 'Óleos',

  // Meat preparations: sausages, ham
  '1601': 'Carnes',
  '1602': 'Carnes',

  // Sugars and confectionery
  '1704': 'Caixa',

  // Cocoa preparations
  '1806': 'Caixa',

  // Cereal preparations: pasta
  '1905': 'Massas',

  // Fruit juices
  '2009': 'Bebidas',

  // Sauces, condiments, mixed seasonings
  '2103': 'Temperos',
  // Soups and broths
  '2104': 'Conservas',
  // Ice cream
  '2105': 'Laticínios',
  // Miscellaneous food preparations (preparações alimentícias não especificadas)
  '2106': 'Outra',

  // Salt
  '2501': 'Temperos',

  // Baking soda, carbonates
  '2836': 'Temperos',
  // Acetic acid (vinegar)
  '2915': 'Temperos',
  // Lecithins
  '2923': 'Temperos',
  // Vitamins
  '2936': 'Temperos',

  // Essential oils (food flavorings)
  '3301': 'Temperos',

  // Starches, dextrins
  '3505': 'Massas',

  // Plastic tableware and kitchenware
  '3924': 'Caixa',

  // Paper tablecloths, napkins, towels
  '4818': 'Caixa',
  '4823': 'Caixa',
  // Printed menus
  '4911': 'Caixa',

  // Table linen, dishcloths
  '6302': 'Caixa',

  // Plastic packaging (caps, lids, bottles)
  '3923': 'Caixa',
  // Glass bottles
  '7010': 'Caixa',

  // Ceramic tableware
  '6911': 'Caixa',
  '6912': 'Caixa',

  // Iron/steel household articles (pans, pots)
  '7323': 'Caixa',
  // Aluminum tableware
  '7615': 'Caixa',

  // Knives, cutlery
  '8211': 'Caixa',
  '8215': 'Caixa',

  // Refrigerators, freezers, kitchen machines
  '8418': 'Caixa',
  '8421': 'Caixa',
  '8422': 'Caixa',
  '8479': 'Caixa',

  // Electric ovens, fryers, coffee makers
  '8516': 'Caixa',
  // Scales
  '8423': 'Caixa',

  // Glassware for table/kitchen
  '7013': 'Caixa',
}

export function getCategoryFromNcm(ncm: string): string | undefined {
  if (!ncm) return undefined

  const clean = ncm.trim().replace(/\D/g, '')
  if (clean.length < 2) return undefined

  // Try first 4 digits (heading level) for precise matches
  if (clean.length >= 4) {
    const heading = clean.substring(0, 4)
    if (NCM_HEADING_OVERRIDES[heading]) return NCM_HEADING_OVERRIDES[heading]
  }

  // Fall back to first 2 digits (chapter level)
  const chapter = clean.substring(0, 2)
  return NCM_CHAPTER_MAP[chapter]
}
