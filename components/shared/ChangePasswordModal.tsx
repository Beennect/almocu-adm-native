import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';
import { FormInput } from '@/components/shared/FormInput';
import { InlineAlert } from '@/components/shared/InlineAlert';
import { EyeIcon, EyeOffIcon, KeyIcon } from '@/components/shared/Icons';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const theme = useAppTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrentPassword('');
      setNewPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setInlineError('');
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  const validate = (): string => {
    if (!currentPassword.trim()) {
      return 'Digite sua senha atual.';
    }
    if (newPassword.length < 6) {
      return 'A nova senha deve ter ao menos 6 caracteres.';
    }
    if (newPassword === currentPassword) {
      return 'A nova senha não pode ser igual à atual.';
    }
    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setInlineError(validationError);
      return;
    }

    setLoading(true);
    setInlineError('');
    try {
      await authStore.changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (err: any) {
      setInlineError(
        err?.response?.data?.message ||
          err?.message ||
          'Erro ao alterar senha. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: theme.foreground }]}>
              <View style={styles.iconHeader}>
                <View style={[styles.iconCircle, { backgroundColor: theme.contrast + '15' }]}>
                  <KeyIcon color={theme.contrast} size={28} />
                </View>
              </View>

              <Text style={[styles.title, { color: theme.text }]}>Alterar Senha</Text>
              <Text style={[styles.subtitle, { color: theme.text }]}>
                Confirme sua senha atual e defina uma nova com no mínimo 6 caracteres.
              </Text>

              {inlineError ? <InlineAlert type="error" message={inlineError} /> : null}

              <View style={styles.fieldLabel}>
                <Text style={[styles.fieldLabelText, { color: theme.text }]}>Senha Atual</Text>
              </View>
              <FormInput
                Icon={KeyIcon}
                placeholder="Digite sua senha atual"
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
                RightIcon={showCurrent ? EyeOffIcon : EyeIcon}
                onRightIconPress={() => setShowCurrent((prev) => !prev)}
              />

              <View style={styles.fieldLabel}>
                <Text style={[styles.fieldLabelText, { color: theme.text }]}>Nova Senha</Text>
              </View>
              <FormInput
                Icon={KeyIcon}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                RightIcon={showNew ? EyeOffIcon : EyeIcon}
                onRightIconPress={() => setShowNew((prev) => !prev)}
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.contrast }]}
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>Salvar Alterações</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: theme.background,
                      borderWidth: 1,
                      borderColor: theme.text + '30',
                    },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancelar</Text>
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
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 20,
    lineHeight: 18,
  },
  fieldLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 2,
  },
  fieldLabelText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    opacity: 0.7,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
});
