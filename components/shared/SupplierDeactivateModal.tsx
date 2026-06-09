import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useAppTheme } from '@/themes/colors';

interface LinkedStockItem {
  _id: string;
  name: string;
  brand?: string;
}

interface SupplierDeactivateModalProps {
  visible: boolean;
  supplierName: string;
  linkedStockItems: LinkedStockItem[];
  onClose: () => void;
  onConfirm: (
    deactivateStockIds: string[],
    unlinkOnlyStockIds: string[],
  ) => void;
  loading?: boolean;
}

export const SupplierDeactivateModal: React.FC<SupplierDeactivateModalProps> = ({
  visible,
  supplierName,
  linkedStockItems,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const theme = useAppTheme();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(linkedStockItems.map((p) => p._id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const allSelected = linkedStockItems.length > 0 && selectedIds.size === linkedStockItems.length;

  const allIds = linkedStockItems.map((p) => p._id);
  const unselectedIds = allIds.filter((id) => !selectedIds.has(id));

  if (linkedStockItems.length === 0) {
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.content, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.title, { color: theme.text }]}>Desativar Fornecedor</Text>
            <Text style={[styles.message, { color: theme.text }]}>
              O fornecedor "{supplierName}" será desativado. Nenhum item de estoque está vinculado a ele.
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn, { backgroundColor: theme.background }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#FF5252' }]}
                onPress={() => onConfirm([], [])}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: 'Jost_600SemiBold', fontSize: 16, color: '#FFFFFF' }}>
                  Desativar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.foreground, maxHeight: '85%' }]}>
          <Text style={[styles.title, { color: theme.text }]}>Desativar Fornecedor</Text>
          <Text style={[styles.message, { color: theme.text }]}>
            O fornecedor <Text style={{ fontFamily: 'Jost_700Bold' }}>"{supplierName}"</Text> está vinculado
            a <Text style={{ fontFamily: 'Jost_700Bold' }}>{linkedStockItems.length} item(ns) de estoque</Text>.
            {'\n\n'}
            Itens marcados serão desativados junto com o fornecedor. Itens desmarcados terão apenas o vínculo
            com o fornecedor removido, mas continuarão ativos no estoque.
          </Text>

          {/* Select All / Deselect All */}
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={allSelected ? deselectAll : selectAll}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectAllText, { color: theme.contrast }]}>
              {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'} ({selectedIds.size}/{linkedStockItems.length})
            </Text>
          </TouchableOpacity>

          {/* Lista de itens vinculados */}
          <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
            {linkedStockItems.map((item) => {
              const isSelected = selectedIds.has(item._id);
              return (
                <TouchableOpacity
                  key={item._id}
                  style={[
                    styles.productRow,
                    { backgroundColor: theme.background },
                    isSelected && { backgroundColor: '#FF525215', borderColor: '#FF5252' },
                  ]}
                  onPress={() => toggleItem(item._id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: theme.text + '40' },
                      isSelected && { backgroundColor: '#FF5252', borderColor: '#FF5252' },
                    ]}
                  >
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.brand && (
                      <Text style={[styles.productCategory, { color: theme.text }]} numberOfLines={1}>
                        {item.brand}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.actionLabel, { color: isSelected ? '#FF5252' : '#FFA726' }]}>
                    {isSelected ? 'Desativar' : 'Remover vínculo'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: theme.background }]}
              onPress={onClose}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#FF5252' }]}
              onPress={() => onConfirm([...selectedIds], unselectedIds)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={{ fontFamily: 'Jost_600SemiBold', fontSize: 16, color: '#FFFFFF' }}>
                {loading ? 'Aplicando...' : 'Confirmar Desativação'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  actionLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    marginLeft: 8,
  },
  selectAllBtn: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  selectAllText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  productList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkMark: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 15,
  },
  productCategory: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {},
  cancelText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 16,
  },
});
