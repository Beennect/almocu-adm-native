import { EmailIcon, EyeIcon, EyeOffIcon, KeyIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';
import { useRouter } from 'expo-router';

import { authStore } from '../../stores/AuthStore';
import { startGoogleLogin } from '../../services/api-oauth-service';

import Toast from 'react-native-toast-message';
import { withLoading } from '@/utils/toast';

export function LoginForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const theme = useAppTheme();
  const router = useRouter();

  const styles = makeStyles(theme.text);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Por favor, preencha todos os campos.' });
      return;
    }

    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Por favor, insira um e-mail válido.' });
      return;
    }

    try {
      await withLoading(
        async () => {
          await authStore.login(email, password);
          router.replace('/(auth)/dashboard');
        },
        { loading: 'Entrando...', success: 'Bem-vindo de volta!', error: 'Erro ao realizar login.' }
      );
    } catch {
      // Erro já exibido pelo withLoading
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
        // Web: a navegação via window.location.href já está em curso.
        // Nada a fazer aqui; o oauth-callback processa o token.
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
        <Text style={styles.subtitle}>Bem-vindo(a) de volta!</Text>
        <Text style={styles.title}>ACESSE SEU PAINEL</Text>
      </View>

      {/* Inputs */}
      <View style={styles.inputBlock}>
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
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          RightIcon={showPassword ? EyeOffIcon : EyeIcon}
          onRightIconPress={() => setShowPassword((prev) => !prev)}
        />
      </View>

      {/* Esqueceu a senha link */}
      <TouchableOpacity 
        style={styles.forgotBtn} 
        activeOpacity={0.7} 
        onPress={() => router.push('/forgot-password' as any)}
      >
        <Text style={styles.forgotBtnText}>Esqueceu a senha?</Text>
      </TouchableOpacity>

      {/* Primary CTA */}
      <FormButton title="ACESSE SUA CONTA" variant="primary" onPress={handleLogin} />

      {/* Criar conta link */}
      <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => router.push('/register' as any)}>
        <Text style={styles.linkText}>Criar conta</Text>
      </TouchableOpacity>

      {/* Social buttons */}
      <View style={styles.socialBlock}>
        <FormButton
          title="Entrar com o Facebook"
          variant="social"
          socialIcon="facebook-f"
          onPress={handleFacebookLogin}
        />
        <FormButton
          title="Entrar com o Google"
          variant="social"
          socialIcon="google"
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
      marginBottom: 32,
    },
    subtitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: textColor,
      marginBottom: 8,
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
    forgotBtn: {
      alignSelf: 'flex-end',
      marginTop: -4,
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    forgotBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: textColor,
      opacity: 0.6,
      textDecorationLine: 'underline',
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
    socialBlock: {
      gap: 8,
    },
  });
}
