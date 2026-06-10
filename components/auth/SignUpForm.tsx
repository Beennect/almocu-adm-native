import { EmailIcon, EyeIcon, EyeOffIcon, KeyIcon, ShieldCheckIcon, UserIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';
import { authStore } from '../../stores/AuthStore';
import { useRouter } from 'expo-router';
import { startGoogleLogin } from '../../services/api-oauth-service';
import { withLoading } from '@/utils/toast';

import Toast from 'react-native-toast-message';

export function SignUpForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const theme = useAppTheme();
  const router = useRouter();

  const styles = makeStyles(theme.text);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePassword = (pass: string) => {
    // Letters, numbers, and symbols
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pass);
    return hasLetters && hasNumbers && hasSymbols;
  };

  const handleRegister = () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Toast.show({ type: 'error', text1: 'Por favor, preencha todos os campos.' });
      return;
    }

    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Por favor, insira um e-mail válido.' });
      return;
    }

    if (!validatePassword(senha)) {
      Toast.show({ type: 'error', text1: 'A senha deve conter letras, números e símbolos.' });
      return;
    }

    if (senha !== confirmarSenha) {
      Toast.show({ type: 'error', text1: 'As senhas não coincidem.' });
      return;
    }

    Toast.show({ type: 'info', text1: 'Criando conta...' });
    try {
      authStore.register(email, senha, nome);
      Toast.show({ type: 'success', text1: 'Conta criada com sucesso! Faça login para continuar.' });
      onToggleForm();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Erro ao realizar cadastro.' });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await startGoogleLogin();

      if (result.cancelled) {
        Toast.show({ type: 'info', text1: 'Login cancelado' });
        return;
      }

      if (!result.token) {
        return;
      }

      await withLoading(
        async () => {
          await authStore.loginWithToken(result.token!);
          router.replace('/(auth)/dashboard');
        },
        {
          loading: 'Conectando com Google...',
          success: 'Bem-vindo!',
          error: 'Não foi possível concluir o login com Google.',
        }
      );
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao iniciar login com Google' });
    }
  };

  const handleFacebookLogin = () => {
    Toast.show({ type: 'info', text1: 'Login com Facebook em breve' });
  };

  return (
    <View style={styles.container}>
      {/* Heading */}
      <View style={styles.headingBlock}>
        <Text style={styles.subtitle}>Junte-se à nós</Text>
        <Text style={styles.title}>GERENCIE, ANALISE E CRESÇA</Text>
      </View>

      {/* Inputs */}
      <View style={styles.inputBlock}>
        <FormInput
          Icon={UserIcon}
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
        />
        <FormInput
          Icon={EmailIcon}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <FormInput
          Icon={KeyIcon}
          placeholder="Senha"
          secureTextEntry={!showPassword}
          value={senha}
          onChangeText={setSenha}
          RightIcon={showPassword ? EyeOffIcon : EyeIcon}
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />
        <FormInput
          Icon={ShieldCheckIcon}
          placeholder="Confirmar senha"
          secureTextEntry={!showConfirmPassword}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          onSubmitEditing={handleRegister}
          RightIcon={showConfirmPassword ? EyeOffIcon : EyeIcon}
          onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
        />
      </View>

      {/* Primary CTA */}
      <FormButton title="CRIE A SUA CONTA" variant="primary" onPress={handleRegister} />

      {/* Link para Login */}
      <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={onToggleForm}>
        <Text style={styles.linkText}>Entrar na conta</Text>
      </TouchableOpacity>

      {/* Social buttons */}
      <View style={styles.socialRow}>
        <FormButton
          variant="social"
          socialIcon="facebook-f"
          style={styles.socialCircle}
          onPress={handleFacebookLogin}
        />
        <FormButton
          variant="social"
          socialIcon="google"
          style={styles.socialCircle}
          onPress={handleGoogleLogin}
        />
      </View>
    </View>
  );
}

function makeStyles(textColor: string) {
  const isMobile = Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth < 768);

  return StyleSheet.create({
    container: {
      width: '100%',
      alignSelf: 'center',
    },
    errorContainer: {
      backgroundColor: '#fee2e2',
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#fecaca',
    },
    errorText: {
      color: '#dc2626',
      fontSize: 14,
      fontFamily: 'Jost_600SemiBold',
      textAlign: 'center',
    },
    headingBlock: {
      alignItems: 'center',
      marginBottom: 28,
    },
    subtitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: textColor,
      marginBottom: 4,
    },
    title: {
      fontFamily: 'Khand_700Bold',
      fontSize: isMobile ? 36 : 42,
      fontWeight: '700',
      color: textColor,
      textAlign: 'center',
      textTransform: 'uppercase',
      lineHeight: isMobile ? 36 : 42,
    },
    inputBlock: {
      marginBottom: 4,
    },
    linkRow: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 20,
    },
    linkText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: textColor,
      textDecorationLine: 'underline',
    },
    socialRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    socialCircle: {
      width: 48,
      paddingHorizontal: 0,
      marginBottom: 0,
    },
  });
}
