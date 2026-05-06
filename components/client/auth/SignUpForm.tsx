import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FormInput } from './FormInput';
import { FormButton } from './FormButton';
import { useAppTheme } from '@/themes/colors';
import { EmailIcon, KeyIcon, UserIcon, ShieldCheckIcon } from '@/components/shared/Icons';

export function SignUpForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const theme = useAppTheme();

  const styles = makeStyles(theme.text);

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
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
        <FormInput
          Icon={ShieldCheckIcon}
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />
      </View>

      {/* Primary CTA */}
      <FormButton title="CRIE A SUA CONTA" variant="primary" />

      {/* Link para Login */}
      <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={onToggleForm}>
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
