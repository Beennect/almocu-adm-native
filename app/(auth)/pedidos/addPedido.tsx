import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  useWindowDimensions, 
  View,
  ScrollView
} from 'react-native';
import { 
  AddEnderecoIcon, 
  ChevronDownIcon, 
  FinalizarPedidoIcon, 
  InfoAdicionaisIcon, 
  MinusIcon, 
  PlusIcon 
} from '../../../components/shared/Icons';
import { SelectModal } from '../../../components/shared/SelectModal';

export default function AddPedidoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { editOrderId } = useLocalSearchParams();
  const styles = makeStyles(theme, isWeb);

  const [mesa, setMesa] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [mesaModalVisible, setMesaModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  const mesaOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
  const itemOptions = ["Canoa Sushi Grande", "Canoa Sushi Pequena", "Combo 1", "Combo 2", "Temaki Salmão"];

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleIncrease = () => {
    setQuantity(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

          <TouchableOpacity 
            style={styles.pickerContainer} 
            activeOpacity={0.7}
            onPress={() => setMesaModalVisible(true)}
          >
            <Text style={styles.pickerText}>{mesa || 'Mesa'}</Text>
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
            <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrease}>
              <MinusIcon color={quantity > 1 ? theme.text : theme.text + '40'} size={16} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity.toString().padStart(2, '0')}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrease}>
              <PlusIcon color={theme.text} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.addMoreContainer} 
          activeOpacity={0.7}
          onPress={() => setItemModalVisible(true)}
        >
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
      </ScrollView>

      <SelectModal 
        visible={mesaModalVisible}
        onClose={() => setMesaModalVisible(false)}
        onSelect={setMesa}
        options={mesaOptions}
        title="Selecione a Mesa"
      />

      <SelectModal 
        visible={itemModalVisible}
        onClose={() => setItemModalVisible(false)}
        onSelect={(item) => console.log('Item selecionado:', item)}
        options={itemOptions}
        title="Adicionar Item"
      />
    </View>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: isWeb ? 32 : 20,
      paddingHorizontal: isWeb ? 32 : 16,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    backBtn: {
      marginRight: 12,
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.foreground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
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
      backgroundColor: theme.foreground,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      marginBottom: 10,
    },
    inputWrapper: {
      flex: 1,
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
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    } as any,
    pickerContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    pickerText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
    },
    // Cart
    cartSection: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cartSectionTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
      marginBottom: 12,
    },
    cartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.background,
    },
    cartItemInfo: {
      flex: 1,
    },
    cartItemName: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
      color: theme.text,
    },
    cartItemPrice: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginTop: 2,
    },
    cartItemControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    qtyBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      borderRadius: 10,
    },
    qtyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
      minWidth: 24,
      textAlign: 'center',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.background,
    },
    totalLabel: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.contrast,
    },
    totalValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.contrast,
    },
    addMoreContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
      marginTop: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    addMoreText: {
      flex: 1,
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
      color: theme.text,
      opacity: 0.5,
    },
    // Address
    addressSection: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      gap: 10,
    },
    sectionTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
      marginBottom: 4,
    },
    cepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: '#EF4444',
      marginTop: -4,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.contrast,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.contrast,
    },
    checkboxLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: theme.text,
    },
    footerLine: {
      height: 1,
      backgroundColor: theme.foreground,
      marginVertical: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    button: {
      flex: 1,
      minWidth: 130,
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonActive: {
      borderWidth: 1.5,
      borderColor: theme.contrast,
    },
    buttonText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_600SemiBold',
    },
    primaryButton: {
      backgroundColor: theme.contrast,
    },
  });
}
