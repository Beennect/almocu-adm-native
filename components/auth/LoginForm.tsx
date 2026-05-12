import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FormInput } from './FormInput';
import { FormButton } from './FormButton';
import { useAppTheme } from '@/themes/colors';
import { EmailIcon, KeyIcon } from '@/components/shared/Icons';

export function LoginForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useAppTheme();

  const styles = makeStyles(theme.text);

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
        />
      </View>

      {/* Primary CTA */}
      <FormButton title="ACESSE SUA CONTA" variant="primary" />

      {/* Criar conta link */}
      <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={onToggleForm}>
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
