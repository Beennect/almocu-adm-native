import { useEffect } from 'react';
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useAppTheme } from '@/themes/colors';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar"
}) => {
  const theme = useAppTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          onConfirm();
          onClose();
        } else if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onConfirm, onClose]);

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
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.message, { color: theme.text }]}>{message}</Text>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.btn, styles.cancelBtn, { backgroundColor: theme.background }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: theme.text }]}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btn, styles.confirmBtn, { backgroundColor: '#FF5252' }]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
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
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Jost_400Regular',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
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
  cancelBtn: {
  },
  confirmBtn: {
  },
  cancelText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 16,
  },
  confirmText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
