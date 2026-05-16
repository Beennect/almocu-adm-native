import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { useAppTheme } from '@/themes/colors';
import { AlmocuIcon, EmailIcon, KeyIcon, ShieldCheckIcon } from '@/components/shared/Icons';
import { toastStore } from '@/stores/ToastStore';
import { authStore } from '@/stores/AuthStore';

export default function ForgotPassword() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { background, foreground, contrast, text } = theme;
  const isWebLayout = width >= 768;
  const router = useRouter();

  // Fluxo de Etapas: 1 = Email, 2 = Código, 3 = Nova Senha
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Código simulado gerado
  const [generatedCode, setGeneratedCode] = useState('');

  const styles = makeStyles(background, foreground, contrast, text, isWebLayout);

  const handleSendEmail = () => {
    if (!email) {
      toastStore.show('Por favor, informe seu e-mail.', 'error');
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      toastStore.show('Insira um e-mail válido.', 'error');
      return;
    }

    // Gerar código de 4 dígitos simulado
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);

    // Alerta simulando envio de email
    Alert.alert(
      'Simulação de E-mail',
      `Um código de recuperação foi enviado para seu e-mail.\n\nCódigo: ${code}`,
      [{ text: 'Copiar Código', onPress: () => {
        setStep(2);
        toastStore.show(`Código de verificação: ${code}`, 'success');
      }}]
    );
  };

  const handleVerifyCode = () => {
    if (!verificationCode) {
      toastStore.show('Digite o código de verificação.', 'error');
      return;
    }
    if (verificationCode !== generatedCode) {
      toastStore.show('Código incorreto. Tente novamente.', 'error');
      return;
    }

    toastStore.show('Código validado com sucesso!', 'success');
    setStep(3);
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      toastStore.show('Preencha os campos de nova senha.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toastStore.show('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastStore.show('As senhas não coincidem.', 'error');
      return;
    }

    // Atualizar a senha no AuthStore se o usuário existir
    try {
      const emailLower = email.toLowerCase().trim();
      const users = [...authStore.users];
      const userIndex = users.findIndex(u => u.email === emailLower);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        authStore.users = users;
        if (Platform.OS === 'web') {
          localStorage.setItem('users', JSON.stringify(users));
        }
      } else {
        // Se for um usuário simulado que não foi registrado ainda nesta sessão
        authStore.register(email, newPassword, 'Restaurante Teste');
      }
      toastStore.show('Senha redefinida com sucesso!', 'success');
      router.replace('/login');
    } catch (e: any) {
      toastStore.show(e.message || 'Erro ao redefinir a senha.', 'error');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <View style={styles.headingBlock}>
              <Text style={styles.subtitle}>Recuperação de Senha</Text>
              <Text style={styles.title}>INSIRA SEU E-MAIL</Text>
              <Text style={styles.description}>
                Enviaremos um código de verificação para o e-mail associado à sua conta.
              </Text>
            </View>
            <View style={styles.inputBlock}>
              <FormInput
                Icon={EmailIcon}
                placeholder="E-mail cadastrado"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={handleSendEmail}
              />
            </View>
            <FormButton title="ENVIAR CÓDIGO" variant="primary" onPress={handleSendEmail} />
          </View>
        );
      case 2:
        return (
          <View>
            <View style={styles.headingBlock}>
              <Text style={styles.subtitle}>Verificação de Segurança</Text>
              <Text style={styles.title}>DIGITE O CÓDIGO</Text>
              <Text style={styles.description}>
                Insira o código de 4 dígitos enviado para <Text style={{ fontFamily: 'Jost_700Bold' }}>{email}</Text>.
              </Text>
            </View>
            <View style={styles.inputBlock}>
              <FormInput
                Icon={ShieldCheckIcon}
                placeholder="Código de 4 dígitos"
                keyboardType="number-pad"
                maxLength={4}
                value={verificationCode}
                onChangeText={setVerificationCode}
                onSubmitEditing={handleVerifyCode}
              />
            </View>
            <FormButton title="VALIDAR CÓDIGO" variant="primary" onPress={handleVerifyCode} />
            <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
              <Text style={styles.resendBtnText}>Alterar e-mail / Reenviar</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View>
            <View style={styles.headingBlock}>
              <Text style={styles.subtitle}>Nova Senha</Text>
              <Text style={styles.title}>CRIE UMA SENHA FORTE</Text>
              <Text style={styles.description}>
                A nova senha deve possuir ao menos 6 caracteres.
              </Text>
            </View>
            <View style={styles.inputBlock}>
              <FormInput
                Icon={KeyIcon}
                placeholder="Nova Senha"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <FormInput
                Icon={KeyIcon}
                placeholder="Confirmar Nova Senha"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleResetPassword}
              />
            </View>
            <FormButton title="SALVAR NOVA SENHA" variant="primary" onPress={handleResetPassword} />
          </View>
        );
      default:
        return null;
    }
  };

  if (isWebLayout) {
    return (
      <View style={styles.webRoot}>
        {/* Blobs de design de fundo */}
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[styles.blob, styles.blobTopRight]}
        />
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.blob, styles.blobBottomLeft]}
        />

        {/* Header */}
        <View style={styles.webHeader}>
          <View style={styles.logoRow}>
            <AlmocuIcon color={contrast} size={128} />
          </View>
          <TouchableOpacity style={styles.clienteBtn} activeOpacity={0.8} onPress={() => router.push('/login')}>
            <Text style={styles.clienteBtnText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>

        {/* Card centralizado */}
        <View style={styles.webCenter}>
          <View style={styles.webCard}>
            {renderContent()}
          </View>
        </View>
      </View>
    );
  }

  // ── Mobile ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mobileContent}>
        <TouchableOpacity style={styles.mobileBack} onPress={() => router.back()}>
          <Text style={styles.mobileBackText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.mobileLogoRow}>
          <AlmocuIcon color={contrast} size={100} />
        </View>

        <View style={styles.formContainer}>
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(background: string, foreground: string, contrast: string, text: string, isWeb: boolean) {
  const isMobile = !isWeb;
  return StyleSheet.create({
    webRoot: {
      flex: 1,
      backgroundColor: background,
      minHeight: Platform.OS === 'web' ? '100vh' : '100%' as any,
      overflow: 'hidden',
    },
    blob: {
      position: 'absolute',
      width: 1000,
      height: 860,
      borderRadius: 500,
      opacity: 0.15,
    },
    blobTopRight: {
      top: -480,
      right: -500,
    },
    blobBottomLeft: {
      bottom: -480,
      left: -500,
    },
    webHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      paddingTop: 24,
      paddingBottom: 8,
      zIndex: 10,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clienteBtn: {
      backgroundColor: contrast,
      borderRadius: 50,
      paddingHorizontal: 28,
      paddingVertical: 12,
    },
    clienteBtnText: {
      fontFamily: 'Jost_700Bold',
      color: '#FFFFFF',
      fontSize: 15,
    },
    webCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      paddingHorizontal: 20,
    },
    webCard: {
      backgroundColor: foreground,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: background,
      paddingVertical: 40,
      paddingHorizontal: 36,
      width: '100%',
      maxWidth: 440,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },
    safe: {
      flex: 1,
      backgroundColor: background,
      paddingHorizontal: 24,
      paddingTop: 10,
    },
    mobileContent: {
      flex: 1,
    },
    mobileBack: {
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },
    mobileBackText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: contrast,
    },
    mobileLogoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
    },
    formContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: 80,
    },
    headingBlock: {
      alignItems: 'center',
      marginBottom: 24,
    },
    subtitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: text,
      marginBottom: 8,
    },
    title: {
      fontFamily: 'Khand_700Bold',
      fontSize: isMobile ? 32 : 36,
      fontWeight: '700',
      color: text,
      textAlign: 'center',
      textTransform: 'uppercase',
      lineHeight: isMobile ? 32 : 36,
      marginBottom: 8,
    },
    description: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: text,
      opacity: 0.7,
      textAlign: 'center',
      paddingHorizontal: 10,
    },
    inputBlock: {
      marginBottom: 12,
      marginTop: 8,
    },
    resendBtn: {
      alignItems: 'center',
      marginTop: 8,
    },
    resendBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: text,
      opacity: 0.6,
      textDecorationLine: 'underline',
    },
  });
}
