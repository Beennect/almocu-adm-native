import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import { permissionStore } from '@/stores/PermissionStore';
import { computeStockDelta, parseAmountInput, sanitizeAmountInput } from '@/utils/stock-helpers';
import { withLoading } from '@/utils/toast';
import {
  ChevronLeftIcon,
  EditIcon,
  TruckIcon,
} from '@/components/shared/Icons';
import Toast from 'react-native-toast-message';

const isUnitInteger = (unit?: string) => !unit || unit === 'Unidades';
const getStepForUnit = (unit?: string) => (isUnitInteger(unit) ? 1 : 0.1);
const getMinForUnit = (unit?: string) => (isUnitInteger(unit) ? 1 : 0.01);
const formatQty = (qty: number, unit?: string) => {
  if (isUnitInteger(unit)) return Math.round(qty).toString();
  return (Math.round(qty * 100) / 100).toString().replace('.', ',');
};

export default observer(function EstoqueItemDetailScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [amount, setAmount] = useState('1');

  useEffect(() => {
    if (!permissionStore.can('stock:view')) {
      router.replace('/(auth)');
    }
  }, []);

  const canEditStock = permissionStore.can('stock:edit');

  useEffect(() => {
    dataStore.refreshStock();
    dataStore.refreshSuppliers();
  }, []);

  const item = dataStore.ingredients.find((i) => i.id === id);

  if (!item) {
    return (
      <View
        style={[
          styles.notFoundContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <TruckIcon color={theme.contrast} size={48} />
        <Text style={[styles.notFoundTitle, { color: theme.text }]}>
          Item não encontrado
        </Text>
        <Text
          style={[styles.notFoundSub, { color: theme.text, opacity: 0.6 }]}
        >
          O item que você está tentando visualizar não existe ou foi removido.
        </Text>
        <TouchableOpacity
          style={[
            styles.notFoundBtn,
            { backgroundColor: theme.foreground },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color={theme.text} size={20} />
          <Text style={[styles.notFoundBtnText, { color: theme.text }]}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdate = async (sign: 1 | -1) => {
    const val = parseAmountInput(amount);
    const { delta, error } = computeStockDelta(item.stock ?? 0, sign, val, {
      name: item.name,
      unit: item.unit,
    });

    if (error || delta === 0) {
      Toast.show({ type: 'error', text1: error || 'Não foi possível ajustar o estoque.' });
      return;
    }

    await withLoading(
      () => dataStore.updateIngredientStock(item.id, delta),
      {
        loading: 'Ajustando estoque...',
        success: 'Estoque ajustado!',
        error: 'Erro ao ajustar estoque',
      }
    );
  };

  const isLowStock = item.minQuantity != null && item.stock <= item.minQuantity;
  const parsedAmount = parseAmountInput(amount);
  const canDecrease =
    (item.stock ?? 0) > 0 &&
    (Number.isFinite(parsedAmount) ? parsedAmount > 0 : false) &&
    (item.stock ?? 0) >= parsedAmount;
  const supplier = item.supplierId
    ? dataStore.suppliers.find((s) => s.id === item.supplierId)
    : null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { backgroundColor: theme.background },
        isWeb && { maxWidth: 720, alignSelf: 'center', width: '100%' },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backArrowBtn, { backgroundColor: theme.foreground }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Visualização do Item do Estoque
          </Text>
          <Text
            style={[styles.headerSub, { color: theme.text, opacity: 0.5 }]}
            numberOfLines={1}
          >
            Detalhes e ajustes de quantidade
          </Text>
        </View>
        {canEditStock && (
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: theme.foreground }]}
            onPress={() =>
              router.push({
                pathname: 'estoque/addItem' as any,
                params: { id: item.id },
              })
            }
            activeOpacity={0.7}
          >
            <EditIcon color={theme.contrast} size={22} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View
          style={[
            styles.unitBadge,
            { backgroundColor: theme.contrast },
          ]}
        >
          <Text style={styles.unitBadgeText}>{item.unit}</Text>
        </View>
      </View>

      {item.brand ? (
        <Text style={[styles.itemBrand, { color: theme.text }]}>
          Marca: {item.brand}
        </Text>
      ) : null}

      {isLowStock ? (
        <View
          style={[
            styles.lowStockBadge,
            { backgroundColor: '#FF525220' },
          ]}
        >
          <Text style={styles.lowStockText}>Estoque Baixo</Text>
        </View>
      ) : null}

      <View
        style={[styles.qtyCard, { backgroundColor: theme.foreground }]}
      >
        <Text style={[styles.qtyLabel, { color: theme.text }]}>
          Quantidade em Estoque
        </Text>
        <View style={styles.qtyRow}>
          {canEditStock && (
            <TouchableOpacity
              style={[
                styles.qtyBtn,
                { backgroundColor: theme.background },
                !canDecrease && styles.qtyBtnDisabled,
              ]}
              onPress={() => handleUpdate(-1)}
              activeOpacity={0.7}
              disabled={!canDecrease}
            >
              <Text style={[styles.qtyBtnText, { color: theme.text }]}>
                −
              </Text>
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.qtyDisplay,
              { backgroundColor: theme.background },
            ]}
          >
            <Text
              style={[
                styles.qtyValue,
                { color: theme.contrast },
              ]}
            >
              {formatQty(item.stock, item.unit)}
            </Text>
            <Text style={[styles.qtyUnit, { color: theme.text }]}>
              {item.unit}
            </Text>
          </View>

          {canEditStock && (
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: theme.contrast }]}
              onPress={() => handleUpdate(1)}
              activeOpacity={0.7}
            >
              <Text style={[styles.qtyBtnText, { color: '#FFFFFF' }]}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {canEditStock && (
          <View style={styles.qtyInputRow}>
            <Text style={[styles.qtyInputLabel, { color: theme.text }]}>
              Incremento:
            </Text>
            <TextInput
              style={[
                styles.qtyInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              value={amount}
              onChangeText={(text) => setAmount(sanitizeAmountInput(text))}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.text + '40'}
            />
            <Text style={[styles.qtyInputHint, { color: theme.text }]}>
              (use +/− para aplicar)
            </Text>
          </View>
        )}

        {item.minQuantity != null && item.minQuantity > 0 ? (
          <Text
            style={[styles.minQuantityText, { color: theme.text }]}
          >
            Estoque mínimo: {formatQty(item.minQuantity, item.unit)} {item.unit}
          </Text>
        ) : null}
      </View>

      {supplier ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Fornecedor
          </Text>
          <View
            style={[
              styles.supplierCard,
              { backgroundColor: theme.foreground },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.supplierItem,
                { backgroundColor: theme.background },
              ]}
              activeOpacity={0.7}
              onPress={() =>
                router.push(`fornecedores/${item.supplierId}` as any)
              }
            >
              <View
                style={[
                  styles.supplierIconBox,
                  { backgroundColor: theme.contrast + '22' },
                ]}
              >
                <TruckIcon color={theme.contrast} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.supplierName,
                    { color: theme.text },
                  ]}
                >
                  {supplier.name}
                </Text>
                {supplier.phone || supplier.cnpj ? (
                  <Text
                    style={[
                      styles.supplierMeta,
                      { color: theme.text },
                    ]}
                  >
                    {supplier.phone ? supplier.phone : ''}
                    {supplier.phone && supplier.cnpj ? ' • ' : ''}
                    {supplier.cnpj ? supplier.cnpj : ''}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  backArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  headerSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  itemName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 24,
    flex: 1,
    minWidth: 200,
  },
  unitBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  unitBadgeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  itemBrand: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
  },
  lowStockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  lowStockText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 11,
    color: '#FF5252',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qtyCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 16,
    marginBottom: 24,
    gap: 16,
  },
  qtyLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  qtyBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qtyBtnDisabled: {
    opacity: 0.3,
  },
  qtyBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 24,
    marginTop: -2,
  },
  qtyDisplay: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qtyValue: {
    fontFamily: 'Jost_700Bold',
    fontSize: 32,
  },
  qtyUnit: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 16,
    opacity: 0.7,
  },
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  qtyInputLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    opacity: 0.5,
  },
  qtyInput: {
    width: 60,
    height: 36,
    textAlign: 'center',
    borderRadius: 10,
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    padding: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as any,
  qtyInputHint: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.5,
  },
  minQuantityText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    opacity: 0.6,
    marginLeft: 4,
    marginBottom: 12,
  },
  supplierCard: {
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  supplierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  supplierIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierName: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  supplierMeta: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    marginTop: 16,
  },
  notFoundSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  notFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notFoundBtnText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
});
