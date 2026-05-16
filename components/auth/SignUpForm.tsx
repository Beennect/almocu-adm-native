import { EmailIcon, KeyIcon, ShieldCheckIcon, UserIcon } from '@/components/shared/Icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/themes/colors';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';
import { authStore } from '../../stores/AuthStore';
import { useRouter } from 'expo-router';

import { toastStore } from '@/stores/ToastStore';

export function SignUpForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useAppTheme();
  const { register } = useAuth();

  const styles = makeStyles(theme.text);

  const handleRegister = async () => {
    if (!nome.trim() || !username.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      await register(nome.trim(), email.trim(), username.trim(), senha);
      router.replace('/(auth)/dashboard');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      const message = error.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
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
          editable={!isLoading}
        />
        <FormInput
          Icon={UserIcon}
          placeholder="Nome de usuário"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
        />
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
          value={senha}
          onChangeText={setSenha}
          editable={!isLoading}
        />
        <FormInput
          Icon={ShieldCheckIcon}
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          editable={!isLoading}
        />
      </View>

      {/* Primary CTA */}
      <FormButton
        title={isLoading ? "" : "CRIE A SUA CONTA"}
        variant="primary"
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading && <ActivityIndicator color="#1A1A1A" />}
      </FormButton>

      {/* Link para Login */}
      <TouchableOpacity
        style={styles.linkRow}
        activeOpacity={0.7}
        onPress={onToggleForm}
        disabled={isLoading}
      >
        <Text style={styles.linkText}>Entrar na conta</Text>
      </TouchableOpacity>

      {/* Social buttons */}
      <View style={styles.socialRow}>
        <FormButton variant="social" socialIcon="facebook-f" style={styles.socialCircle} />
        <FormButton variant="social" socialIcon="google" style={styles.socialCircle} />
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
