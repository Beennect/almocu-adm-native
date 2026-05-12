import React from 'react';
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  FlatList, 
  TouchableWithoutFeedback 
} from 'react-native';
import { useAppTheme } from '@/themes/colors';

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
                <View style={[styles.headerLine, { backgroundColor: theme.background }]} />
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.option}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <Text style={[styles.optionText, { color: theme.text }]}>{item}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={[styles.separator, { backgroundColor: theme.background }]} />
                )}
                contentContainerStyle={styles.listContent}
              />

              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: theme.background }]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>Cancelar</Text>
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
    paddingVertical: 10,
  },
  option: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 16,
  },
  separator: {
    height: 1,
    width: '100%',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 16,
  },
});
