import {
  ChevronDownIcon,
  ChevronLeftIcon,
  TruckIcon
} from '@/components/shared/Icons';
import { SelectModal } from '@/components/shared/SelectModal';
import { dataStore } from '@/stores/DataStore';
import { useAppTheme } from '@/themes/colors';
import { withLoading } from '@/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseNfeXml, ParsedXmlItem } from '@/utils/xmlParser';
import { getCategoryFromNcm } from '@/utils/ncmCategories';
import { getConversionInfo, applyConversion, ConversionInfo } from '@/utils/unitConversion';

const UNIT_OPTIONS = ['Kg', 'Litros', 'Unidades'];
const CATEGORY_OPTIONS = ['Grãos', 'Laticínios', 'Carnes', 'Massa', 'Conservas', 'Óleos', 'Bebidas', 'Temperos', 'Caixa', 'Outra...'];

const sanitizeNumeric = (text: string) => text.replace(/[^0-9.,]/g, '');

export default observer(function AddStockItemScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const editingId = typeof params.id === 'string' ? params.id : null;
  const isEditing = !!editingId;
  const styles = makeStyles(theme, isWeb);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [category, setCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [unitPrice, setUnitPrice] = useState('');

  const [xmlModalVisible, setXmlModalVisible] = useState(false);
  const [xmlPasteText, setXmlPasteText] = useState('');
  const [parsedXmlItems, setParsedXmlItems] = useState<ParsedXmlItem[]>([]);
  const [itemSelectionVisible, setItemSelectionVisible] = useState(false);
  const [xmlImportLoading, setXmlImportLoading] = useState(false);
  const [conversionVisible, setConversionVisible] = useState(false);
  const [conversionInfo, setConversionInfo] = useState<ConversionInfo | null>(null);
  const [conversionFactor, setConversionFactor] = useState('');
  const [pendingXmlItem, setPendingXmlItem] = useState<ParsedXmlItem | null>(null);

  useEffect(() => {
    if (!editingId) return;
    const item = dataStore.ingredients.find(i => i.id === editingId);
    if (item) {
      setName(item.name);
      setBrand(item.brand || '');
      setUnit(item.unit);
      setQuantity(item.stock.toString());
      setMinQuantity((item.minQuantity ?? 0).toString());
      setSupplierId(item.supplierId || null);
      setCategory(item.category);
      setShowCustomCategory(!CATEGORY_OPTIONS.slice(0, -1).includes(item.category));
      setUnitPrice(item.unitPrice ? item.unitPrice.toString() : '');
    }
  }, [editingId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o nome do item.' });
      return;
    }
    if (!unit) {
      Toast.show({ type: 'error', text1: 'Selecione o tipo de medida.' });
      return;
    }
    if (!category.trim()) {
      Toast.show({ type: 'error', text1: 'Selecione ou digite a categoria.' });
      return;
    }
    const qty = parseFloat(quantity.replace(',', '.'));
    if (isNaN(qty) || qty < 0) {
      Toast.show({ type: 'error', text1: 'Quantidade inválida.' });
      return;
    }
    const minQty = minQuantity ? parseFloat(minQuantity.replace(',', '.')) : 0;
    if (isNaN(minQty) || minQty < 0) {
      Toast.show({ type: 'error', text1: 'Quantidade mínima inválida.' });
      return;
    }

    await withLoading(
      async () => {
        if (isEditing && editingId) {
          const up = parseFloat(unitPrice.replace(',', '.'));
          await dataStore.updateIngredient(editingId, {
            name: name.trim(),
            brand: brand.trim(),
            unit,
            stock: qty,
            minQuantity: minQty,
            supplierId: supplierId || undefined,
            category: category.trim(),
            unitPrice: isNaN(up) || up <= 0 ? undefined : up,
          });
        } else {
          const up = parseFloat(unitPrice.replace(',', '.'));
          await dataStore.addIngredient({
            name: name.trim(),
            brand: brand.trim(),
            unit,
            stock: qty,
            minQuantity: minQty,
            supplierId: supplierId || undefined,
            category: category.trim(),
            unitPrice: isNaN(up) || up <= 0 ? undefined : up,
          });
        }
        router.back();
      },
      {
        loading: isEditing ? 'Atualizando item...' : 'Adicionando item...',
        success: isEditing ? 'Item atualizado!' : 'Item adicionado ao estoque!',
        error: 'Erro ao salvar item',
      },
    );
  };

  const selectedSupplierName = supplierId
    ? dataStore.suppliers.find(s => s.id === supplierId)?.name || 'Fornecedor'
    : null;

  const handleOpenXmlFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.length) return
      setXmlImportLoading(true)
      const uri = result.assets[0].uri

      let content: string
      try {
        content = await FileSystem.readAsStringAsync(uri)
      } catch {
        const response = await fetch(uri)
        content = await response.text()
      }

      if (!content.trim().startsWith('<')) {
        Toast.show({ type: 'error', text1: 'O arquivo não parece ser um XML válido.' })
        return
      }
      const items = parseNfeXml(content)
      if (items.length === 0) {
        Toast.show({ type: 'error', text1: 'Nenhum item encontrado no XML.' })
        return
      }
      setParsedXmlItems(items)
      setXmlModalVisible(false)
      setXmlPasteText('')
      setItemSelectionVisible(true)
    } catch (e) {
      console.error('XML import error:', e)
      Toast.show({ type: 'error', text1: 'Erro ao ler o arquivo.' })
    } finally {
      setXmlImportLoading(false)
    }
  }

  const handleParsePastedXml = () => {
    const trimmed = xmlPasteText.trim()
    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Cole o conteúdo do XML primeiro.' })
      return
    }
    try {
      const items = parseNfeXml(trimmed)
      if (items.length === 0) {
        Toast.show({ type: 'error', text1: 'Nenhum item encontrado no XML.' })
        return
      }
      setParsedXmlItems(items)
      setXmlModalVisible(false)
      setXmlPasteText('')
      setItemSelectionVisible(true)
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao interpretar o XML.' })
    }
  }

  const handleSelectXmlItem = (item: ParsedXmlItem) => {
    setItemSelectionVisible(false)
    setPendingXmlItem(item)

    const suggestedCategory = getCategoryFromNcm(item.ncm)

    if (suggestedCategory) {
      const isCustom = !CATEGORY_OPTIONS.slice(0, -1).includes(suggestedCategory)
      setCategory(suggestedCategory)
      setShowCustomCategory(isCustom)
    }

    const xmlUnit = item.unit
    let targetUnit = ''

    if (/^kg$/i.test(xmlUnit)) targetUnit = 'Kg'
    else if (/^l(?:itros?)?$/i.test(xmlUnit)) targetUnit = 'Litros'
    else if (/^un$/i.test(xmlUnit)) targetUnit = 'Unidades'
    else targetUnit = 'Unidades'

    const conv = getConversionInfo(xmlUnit, targetUnit)

    if (conv.needsInput) {
      setConversionInfo(conv)
      setConversionFactor('1')
      setConversionVisible(true)
    } else {
      applyAndFill(item, targetUnit, conv.factor ?? 1)
    }
  }

  const applyAndFill = (item: ParsedXmlItem, targetUnit: string, factor: number) => {
    const { convertedQuantity, convertedUnitPrice } = applyConversion(
      item.quantity,
      item.unitPrice,
      factor,
    )
    setName(item.name)
    setUnit(targetUnit)
    setQuantity(convertedQuantity.toString())
    setUnitPrice(convertedUnitPrice > 0 ? convertedUnitPrice.toFixed(2) : '')
    setBrand('')
    setMinQuantity('')
    setSupplierId(null)
    setPendingXmlItem(null)
    setConversionVisible(false)
  }

  const handleConfirmConversion = () => {
    if (!pendingXmlItem || !conversionInfo) return
    const factorStr = conversionFactor.replace(',', '.')
    const factor = parseFloat(factorStr)
    if (isNaN(factor) || factor <= 0) {
      Toast.show({ type: 'error', text1: 'Informe um fator de conversão válido.' })
      return
    }
    let targetUnit = ''
    const xu = pendingXmlItem.unit.toUpperCase()
    if (/^KG$/i.test(xu)) targetUnit = 'Kg'
    else if (/^L(?:ITROS?)?$/i.test(xu)) targetUnit = 'Litros'
    else if (/^UN$/i.test(xu)) targetUnit = 'Unidades'
    else targetUnit = 'Unidades'
    applyAndFill(pendingXmlItem, targetUnit, factor)
  }

  const handleSkipConversion = () => {
    if (!pendingXmlItem) return
    let targetUnit = ''
    const xu = pendingXmlItem.unit.toUpperCase()
    if (/^KG$/i.test(xu)) targetUnit = 'Kg'
    else if (/^L(?:ITROS?)?$/i.test(xu)) targetUnit = 'Litros'
    else if (/^UN$/i.test(xu)) targetUnit = 'Unidades'
    else targetUnit = 'Unidades'
    applyAndFill(pendingXmlItem, targetUnit, 1)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.foreground }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon color={theme.text} size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Editar Item' : 'Novo Item'}
            </Text>
            <Text style={styles.headerSub}>
              {isEditing ? 'Atualize os dados do item.' : 'Adicione um novo item ao estoque.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.importXmlBtn, { backgroundColor: theme.foreground, borderColor: theme.contrast + '40' }]}
          onPress={() => setXmlModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.importXmlBtnText, { color: theme.contrast }]}>
            Importar de Nota Fiscal
          </Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 2 }}>
                <Text style={styles.label}>Nome do Item *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Ex: Farinha de trigo"
                  placeholderTextColor={theme.text + '60'}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Marca</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Ex: Dona Benta"
                  placeholderTextColor={theme.text + '60'}
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Tipo de Medida *</Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, { backgroundColor: theme.background }]}
                  onPress={() => setUnitModalVisible(true)}
                >
                  <Text style={{ color: unit ? theme.text : theme.text + '60', fontSize: 14 }}>
                    {unit || 'Selecione...'}
                  </Text>
                  <ChevronDownIcon color={theme.text} size={18} opacity={0.5} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Quantidade Inicial *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Ex: 10"
                  placeholderTextColor={theme.text + '60'}
                  keyboardType="decimal-pad"
                  value={quantity}
                  onChangeText={(v) => setQuantity(sanitizeNumeric(v))}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Quantidade Mínima</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Ex: 2"
                  placeholderTextColor={theme.text + '60'}
                  keyboardType="decimal-pad"
                  value={minQuantity}
                  onChangeText={(v) => setMinQuantity(sanitizeNumeric(v))}
                />
                <Text style={styles.helperText}>
                  Alerta de estoque baixo quando atingir este valor
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Fornecedor</Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, { backgroundColor: theme.background }]}
                  onPress={() => setSupplierModalVisible(true)}
                >
                  <Text
                    style={{
                      color: selectedSupplierName ? theme.text : theme.text + '60',
                      fontSize: 14,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {selectedSupplierName || 'Nenhum'}
                  </Text>
                  <ChevronDownIcon color={theme.text} size={18} opacity={0.5} />
                </TouchableOpacity>
              </View>
            </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Categoria *</Text>
              {showCustomCategory ? (
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Digite a categoria..."
                  placeholderTextColor={theme.text + '60'}
                  value={category}
                  onChangeText={setCategory}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.pickerContainer, { backgroundColor: theme.background }]}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Text style={{ color: category ? theme.text : theme.text + '60', fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {category || 'Selecione...'}
                  </Text>
                  <ChevronDownIcon color={theme.text} size={18} opacity={0.5} />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Valor Unitário (R$)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Ex: 12,50"
                placeholderTextColor={theme.text + '60'}
                keyboardType="decimal-pad"
                value={unitPrice}
                onChangeText={(v) => setUnitPrice(sanitizeNumeric(v))}
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.contrast }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Salvar Alterações' : 'Adicionar Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* XML Input Modal */}
        <Modal
          transparent
          visible={xmlModalVisible}
          animationType="fade"
          onRequestClose={() => setXmlModalVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Importar de Nota Fiscal</Text>
              <View style={[styles.headerLine, { backgroundColor: theme.text + '20' }]} />

              <TouchableOpacity
                style={[styles.xmlFileBtn, { borderColor: theme.contrast + '40' }]}
                onPress={handleOpenXmlFile}
                activeOpacity={0.7}
              >
                {xmlImportLoading ? (
                  <ActivityIndicator color={theme.contrast} size="small" />
                ) : (
                  <Text style={[styles.xmlFileBtnText, { color: theme.contrast }]}>
                    Selecionar arquivo .xml
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.xmlDivider}>
                <View style={[styles.xmlDividerLine, { backgroundColor: theme.text + '20' }]} />
                <Text style={[styles.xmlDividerText, { color: theme.text + '60' }]}>ou cole o XML abaixo</Text>
                <View style={[styles.xmlDividerLine, { backgroundColor: theme.text + '20' }]} />
              </View>

              <TextInput
                style={[styles.xmlTextInput, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Cole o conteúdo da Nota Fiscal aqui..."
                placeholderTextColor={theme.text + '40'}
                multiline
                textAlignVertical="top"
                value={xmlPasteText}
                onChangeText={setXmlPasteText}
              />

              <TouchableOpacity
                style={[styles.xmlParseBtn, { backgroundColor: theme.contrast }]}
                onPress={handleParsePastedXml}
                activeOpacity={0.8}
              >
                <Text style={styles.xmlParseBtnText}>Parsear XML</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.xmlCancelBtn, { backgroundColor: theme.background }]}
                onPress={() => {
                  setXmlModalVisible(false)
                  setXmlPasteText('')
                }}
              >
                <Text style={[styles.xmlCloseBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Item Selection Modal */}
        <Modal
          transparent
          visible={itemSelectionVisible}
          animationType="fade"
          onRequestClose={() => setItemSelectionVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Selecione o Item</Text>
              <View style={[styles.headerLine, { backgroundColor: theme.text + '20' }]} />

              <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
                {parsedXmlItems.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item.code}-${idx}`}
                    style={[styles.xmlItemOption, { borderColor: theme.text + '20' }]}
                    onPress={() => handleSelectXmlItem(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.xmlItemName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.xmlItemDetails}>
                      <Text style={[styles.xmlItemDetail, { color: theme.text + '80' }]}>
                        {item.unit === 'UN' ? 'Unidade' : item.unit}  ·  Qtd: {item.quantity}
                      </Text>
                      <Text style={[styles.xmlItemPrice, { color: theme.contrast }]}>
                        R$ {item.unitPrice.toFixed(2)}/{item.unit}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.xmlCancelBtn, { backgroundColor: theme.background }]}
                onPress={() => setItemSelectionVisible(false)}
              >
                <Text style={[styles.xmlCloseBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Conversion Modal */}
        <Modal
          transparent
          visible={conversionVisible}
          animationType="fade"
          onRequestClose={() => setConversionVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Converter Unidade</Text>
              <View style={[styles.headerLine, { backgroundColor: theme.text + '20' }]} />

              {pendingXmlItem && conversionInfo && (
                <View>
                  <Text style={[styles.convItemName, { color: theme.text }]}>
                    {pendingXmlItem.name}
                  </Text>

                  <View style={styles.convOriginal}>
                    <Text style={[styles.convLabel, { color: theme.text + '60' }]}>
                      Original (XML)
                    </Text>
                    <Text style={[styles.convValue, { color: theme.text }]}>
                      {pendingXmlItem.quantity} {pendingXmlItem.unit}  ·  R$ {pendingXmlItem.unitPrice.toFixed(2)}/{pendingXmlItem.unit}
                    </Text>
                  </View>

                  <Text style={[styles.convQuestion, { color: theme.text }]}>
                    {conversionInfo.question}
                  </Text>

                  <TextInput
                    style={[styles.convInput, { backgroundColor: theme.background, color: theme.text }]}
                    keyboardType="decimal-pad"
                    placeholder="Ex: 12"
                    placeholderTextColor={theme.text + '40'}
                    value={conversionFactor}
                    onChangeText={(v) => setConversionFactor(v.replace(/[^0-9.,]/g, ''))}
                  />

                  {(() => {
                    const f = parseFloat(conversionFactor.replace(',', '.'))
                    if (!isNaN(f) && f > 0) {
                      const { convertedQuantity, convertedUnitPrice } = applyConversion(
                        pendingXmlItem.quantity,
                        pendingXmlItem.unitPrice,
                        f,
                      )
                      let tu = ''
                      const xu = pendingXmlItem.unit.toUpperCase()
                      if (/^KG$/i.test(xu)) tu = 'Kg'
                      else if (/^L(?:ITROS?)?$/i.test(xu)) tu = 'Litros'
                      else if (/^UN$/i.test(xu)) tu = 'Unidades'
                      else tu = 'Unidades'
                      return (
                        <View style={styles.convResult}>
                          <View style={[styles.convResultLine, { backgroundColor: theme.contrast + '15' }]}>
                            <Text style={[styles.convResultLabel, { color: theme.text + '60' }]}>
                              Quantidade
                            </Text>
                            <Text style={[styles.convResultValue, { color: theme.text }]}>
                              {convertedQuantity.toFixed(3)} {tu}
                            </Text>
                          </View>
                          <View style={[styles.convResultLine, { backgroundColor: theme.contrast + '15' }]}>
                            <Text style={[styles.convResultLabel, { color: theme.text + '60' }]}>
                              Valor Unitário
                            </Text>
                            <Text style={[styles.convResultValue, { color: theme.contrast }]}>
                              R$ {convertedUnitPrice.toFixed(2)}/{tu}
                            </Text>
                          </View>
                        </View>
                      )
                    }
                    return null
                  })()}
                </View>
              )}

              <View style={styles.convActions}>
                <TouchableOpacity
                  style={[styles.convConfirmBtn, { backgroundColor: theme.contrast }]}
                  onPress={handleConfirmConversion}
                  activeOpacity={0.8}
                >
                  <Text style={styles.convConfirmText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.convSkipBtn, { backgroundColor: theme.background }]}
                  onPress={handleSkipConversion}
                >
                  <Text style={[styles.convSkipText, { color: theme.text }]}>Usar como está</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <SelectModal
          visible={unitModalVisible}
          onClose={() => setUnitModalVisible(false)}
          onSelect={(val: string) => {
            setUnit(val);
            setUnitModalVisible(false);
          }}
          options={UNIT_OPTIONS}
          title="Selecione a Unidade"
        />

        <SelectModal
          visible={supplierModalVisible}
          onClose={() => setSupplierModalVisible(false)}
          onSelect={(val: string) => {
            if (val === 'Nenhum') {
              setSupplierId(null);
            } else {
              const found = dataStore.suppliers.find(s => s.name === val);
              if (found) setSupplierId(found.id);
            }
            setSupplierModalVisible(false);
          }}
          options={['Nenhum', ...dataStore.suppliers.map(s => s.name)]}
          title="Selecione o Fornecedor"
        />

        <SelectModal
          visible={categoryModalVisible}
          onClose={() => setCategoryModalVisible(false)}
          onSelect={(val: string) => {
            if (val === 'Outra...') {
              setShowCustomCategory(true);
              setCategory('');
            } else {
              setShowCustomCategory(false);
              setCategory(val);
            }
            setCategoryModalVisible(false);
          }}
          options={CATEGORY_OPTIONS}
          title="Selecione a Categoria"
        />
      </View>
    </KeyboardAvoidingView>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    backBtn: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 24,
      color: theme.text,
    },
    headerSub: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
      marginTop: 2,
    },
    scrollContent: {
      gap: 16,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: theme.foreground,
      borderRadius: 24,
      padding: 20,
      gap: 16,
    },
    label: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: theme.text,
      marginBottom: 6,
      marginLeft: 4,
    },
    helperText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 11,
      color: theme.text,
      opacity: 0.5,
      marginLeft: 4,
      marginTop: 4,
    },
    input: {
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      outlineStyle: 'none',
    } as any,
    pickerContainer: {
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actions: {
      gap: 12,
      marginTop: 8,
    },
    saveBtn: {
      paddingVertical: 18,
      borderRadius: 18,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      shadowColor: theme.contrast,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    saveBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },

    // XML Import
    importXmlBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 18,
      marginBottom: 16,
      borderWidth: 1.5,
    },
    importXmlBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
    },

    // Modal shared
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 460,
      borderRadius: 24,
      padding: 24,
      maxHeight: '90%',
    },
    modalTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 12,
    },
    headerLine: {
      height: 1,
      width: '100%',
      marginBottom: 20,
    },

    // XML Input Modal
    xmlFileBtn: {
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    xmlFileBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
    },
    xmlDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    xmlDividerLine: {
      flex: 1,
      height: 1,
    },
    xmlDividerText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
    },
    xmlTextInput: {
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 13,
      fontFamily: 'Jost_400Regular',
      minHeight: 120,
      outlineStyle: 'none',
      marginBottom: 16,
    } as any,
    xmlParseBtn: {
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    xmlParseBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    xmlCancelBtn: {
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    xmlCloseBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
    },

    // Item Selection Modal
    xmlItemOption: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 8,
    },
    xmlItemName: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
      marginBottom: 4,
    },
    xmlItemDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    xmlItemDetail: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
    },
    xmlItemPrice: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
    },

    // Conversion Modal
    convItemName: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      marginBottom: 16,
      textAlign: 'center',
    },
    convOriginal: {
      backgroundColor: 'rgba(150,150,150,0.08)',
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
    },
    convLabel: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      marginBottom: 4,
    },
    convValue: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
    },
    convQuestion: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      marginBottom: 12,
      textAlign: 'center',
    },
    convInput: {
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 18,
      fontFamily: 'Jost_700Bold',
      textAlign: 'center',
      outlineStyle: 'none',
      marginBottom: 16,
    } as any,
    convResult: {
      gap: 8,
      marginBottom: 20,
    },
    convResultLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    convResultLabel: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
    },
    convResultValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
    },
    convActions: {
      gap: 10,
    },
    convConfirmBtn: {
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    convConfirmText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    convSkipBtn: {
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    convSkipText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
    },
  });
}
