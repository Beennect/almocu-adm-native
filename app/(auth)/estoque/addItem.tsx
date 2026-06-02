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
  KeyboardAvoidingView,
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

const UNIT_OPTIONS = ['Kg', 'Litros', 'Unidades'];

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
          await dataStore.updateIngredient(editingId, {
            name: name.trim(),
            brand: brand.trim(),
            unit,
            stock: qty,
            minQuantity: minQty,
            supplierId: supplierId || undefined,
          });
        } else {
          await dataStore.addIngredient({
            name: name.trim(),
            brand: brand.trim(),
            unit,
            stock: qty,
            minQuantity: minQty,
            supplierId: supplierId || undefined,
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
  });
}
