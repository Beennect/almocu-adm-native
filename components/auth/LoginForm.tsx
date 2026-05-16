import { EmailIcon, KeyIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';
import { useRouter } from 'expo-router';

import { authStore } from '../../stores/AuthStore';

import { toastStore } from '@/stores/ToastStore';

export function LoginForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useAppTheme();
  const router = useRouter();

  const styles = makeStyles(theme.text);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLogin = () => {
    if (!email || !password) {
      toastStore.show('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      toastStore.show('Por favor, insira um e-mail válido.', 'error');
      return;
    }

    try {
      authStore.login(email, password);
      toastStore.show('Bem-vindo de volta!', 'success');
      router.replace('/(auth)/dashboard');
    } catch (err: any) {
      toastStore.show(err.message || 'Erro ao realizar login.', 'error');
    }
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
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
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
        <FormButton title="Entrar com o Facebook" variant="social" socialIcon="facebook-f" />
        <FormButton title="Entrar com o Google" variant="social" socialIcon="google" />
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
