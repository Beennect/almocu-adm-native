import { useAppTheme } from '@/themes/colors';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AddEnderecoIcon, ChevronDownIcon, FinalizarPedidoIcon, InfoAdicionaisIcon, MinusIcon, PlusIcon } from '../../../components/shared/Icons';

export default function AddPedidoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const styles = makeStyles(theme, isWeb);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sobre o pedido</Text>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nome do cliente"
            placeholderTextColor={theme.text + '80'}
          />
        </View>

        <TouchableOpacity style={styles.pickerContainer} activeOpacity={0.7}>
          <Text style={styles.pickerText}>Mesa</Text>
          <View style={styles.pickerDivider} />
          <ChevronDownIcon color={theme.text} opacity={0.5} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemCard}>
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>Canoa Sushi Grande</Text>
          <Text style={styles.itemDesc} numberOfLines={2}>
            30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...
          </Text>
          <Text style={styles.itemPrice}>R$ 140,00</Text>
        </View>

        <View style={styles.quantityDivider} />

        <View style={styles.quantitySelector}>
          <TouchableOpacity style={styles.qtyBtn}>
            <MinusIcon color={theme.contrast} size={16} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>01</Text>
          <TouchableOpacity style={styles.qtyBtn}>
            <PlusIcon color={theme.text} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.addMoreContainer} activeOpacity={0.7}>
        <Text style={styles.addMoreText}>Adicionar item ao pedido</Text>
        <View style={styles.pickerDivider} />
        <ChevronDownIcon color={theme.text} opacity={0.5} size={20} />
      </TouchableOpacity>

      <View style={styles.footerLine} />

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.secondaryBtn}>
          <AddEnderecoIcon color={theme.text} size={28} />
          <Text style={styles.secondaryBtnText}>Adicionar Endereço</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <InfoAdicionaisIcon color={theme.text} size={28} />
          <Text style={styles.secondaryBtnText}>Informações Adicionais</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn}>
          <FinalizarPedidoIcon color="#FFFFFF" size={30} />
          <Text style={styles.primaryBtnText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: isWeb ? 40 : 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    headerTitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
      marginRight: 12,
    },
    headerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.background,
    },
    row: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    inputContainer: {
      flex: 1,
      backgroundColor: theme.foreground,
      borderRadius: 16,
      height: 64,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },
    input: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: theme.text,
      outlineStyle: 'none',
    } as any,
    pickerContainer: {
      width: 180,
      backgroundColor: theme.foreground,
      borderRadius: 16,
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    pickerText: {
      flex: 1,
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: theme.text,
      opacity: 0.5,
    },
    pickerDivider: {
      width: 1,
      height: '40%',
      borderLeftWidth: 1,
      borderColor: theme.background,
      marginHorizontal: 12,
      borderStyle: 'dashed',
    },
    itemCard: {
      backgroundColor: theme.foreground,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    itemContent: {
      flex: 1,
      paddingRight: 12,
    },
    itemName: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    itemDesc: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginVertical: 6,
      lineHeight: 18,
    },
    itemPrice: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    quantityDivider: {
      width: 1,
      height: '60%',
      borderLeftWidth: 1,
      borderColor: theme.background,
      borderStyle: 'dashed',
    },
    quantitySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 16,
    },
    qtyBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
      minWidth: 24,
      textAlign: 'center',
    },
    addMoreContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 40,
    },
    addMoreText: {
      flex: 1,
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: theme.text,
      opacity: 0.5,
    },
    footerLine: {
      height: 1,
      backgroundColor: theme.background,
      marginBottom: 40,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.foreground,
      paddingHorizontal: 28,
      height: 64,
      borderRadius: 20,
      gap: 12,
    },
    secondaryBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.text,
    },
    primaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.contrast,
      height: 64,
      borderRadius: 20,
      gap: 12,
    },
    primaryBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: '#FFFFFF',
    },
  });
}
