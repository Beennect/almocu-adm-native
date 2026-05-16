import { EmailIcon, KeyIcon } from '@/components/shared/Icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/themes/colors';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';
import { useRouter } from 'expo-router';

import { authStore } from '../../stores/AuthStore';

import { toastStore } from '@/stores/ToastStore';

export function LoginForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useAppTheme();
  const { login } = useAuth();

  const styles = makeStyles(theme.text);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password.trim());
      router.replace('/(auth)/dashboard');
    } catch (error: any) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
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
          editable={!isLoading}
        />
        <FormInput
          Icon={KeyIcon}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
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
      <FormButton
        title={isLoading ? "" : "ACESSE SUA CONTA"}
        variant="primary"
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading && <ActivityIndicator color="#1A1A1A" />}
      </FormButton>

      {/* Criar conta link */}
      <TouchableOpacity
        style={styles.linkRow}
        activeOpacity={0.7}
        onPress={onToggleForm}
        disabled={isLoading}
      >
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
