import React from 'react';
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  TouchableWithoutFeedback 
} from 'react-native';
import { useAppTheme } from '@/themes/colors';

import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface SelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  options: string[];
  title?: string;
}

export const SelectModal: React.FC<SelectModalProps> = ({ 
  visible, 
  onClose, 
  onSelect, 
  options,
  title = "Selecione uma opção"
}) => {
  const theme = useAppTheme();

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6;
  
  const totalPages = Math.ceil(options.length / itemsPerPage);
  const paginatedOptions = options.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    if (visible) setCurrentPage(1);
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: theme.foreground }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <View style={[styles.headerLine, { backgroundColor: theme.text + '20' }]} />
              </View>

              <ScrollView contentContainerStyle={styles.listContent}>
                {options.length > 0 ? (
                  paginatedOptions.map((item, index) => (
                    <TouchableOpacity 
                      key={`${item}-${index}`}
                      style={[styles.option, { borderColor: theme.text + '20' }]}
                      onPress={() => {
                        onSelect(item);
                        onClose();
                      }}
                    >
                      <Text style={[styles.optionText, { color: theme.text }]}>{item}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.text }]}>Nada disponível por aqui...</Text>
                    <Text style={[styles.emptySubtext, { color: theme.text }]}>Parece que você ainda não cadastrou nada nesta categoria.</Text>
                  </View>
                )}
              </ScrollView>

              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon color={theme.text} size={20} />
                  </TouchableOpacity>
                  
                  <View style={styles.pageIndicator}>
                    <Text style={[styles.pageIndicatorText, { color: theme.text }]}>{currentPage} / {totalPages}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon color={theme.text} size={20} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: theme.background }]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerLine: {
    height: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: 10,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 8,
  },
  optionText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pageIndicatorText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: 20,
  },
});
