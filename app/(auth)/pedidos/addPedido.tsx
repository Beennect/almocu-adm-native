import { useAppTheme } from '@/themes/colors';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { 
  AddEnderecoIcon, 
  ChevronDownIcon, 
  FinalizarPedidoIcon, 
  InfoAdicionaisIcon, 
  MinusIcon, 
  PlusIcon 
} from '../../../components/shared/Icons';

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
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nome do cliente"
            placeholderTextColor={theme.text + '80'}
          />
        </View>

        <TouchableOpacity style={styles.pickerContainer} activeOpacity={0.7}>
          <Text style={styles.pickerText}>Mesa</Text>
          <View style={styles.pickerIconContainer}>
            <ChevronDownIcon color={theme.text} size={20} />
          </View>
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <AddEnderecoIcon color={theme.text} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Adicionar Endereço</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <InfoAdicionaisIcon color={theme.text} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Informações Adicionais</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{...styles.button, ...styles.primaryButton}}>
          <FinalizarPedidoIcon color={theme.foreground} style={styles.primaryButtonIcon} />
          <Text style={styles.primaryButtonText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: isWeb ? 32 : 20,
      paddingHorizontal: isWeb ? 32 : 16,
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
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    inputWrapper: {
      flex: 1,
      minWidth: 140,
    },
    input: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      outlineStyle: 'none',
    } as any,
    pickerContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 100,
    },
    pickerText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      marginRight: 8,
    },
    pickerIconContainer: {
      marginLeft: 4,
      color: theme.text,
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
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      flexWrap: 'wrap',
    },
    button: {
      flex: isWeb ? 1 : undefined,
      flexGrow: 1,
      minWidth: isWeb ? 'auto' : 140,
      backgroundColor: theme.foreground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    buttonIcon: {
      fontSize: 18,
      color: theme.text,
    },
    buttonText: {
      color: theme.text,
      fontSize: 12,
      fontFamily: 'Jost_400Regular',
      fontWeight: '500',
    },
    primaryButton: {
      backgroundColor: theme.contrast,
    },
    primaryButtonIcon: {
      fontSize: 16,
      color: theme.foreground,
    },
    primaryButtonText: {
      color: theme.foreground,
      fontSize: 12,
      fontFamily: 'Jost_400Regular',
      fontWeight: '600',
    },
  });
}
