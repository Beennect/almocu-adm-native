import { EmailIcon, KeyIcon, ShieldCheckIcon, UserIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { FormButton } from './FormButton';
import { FormInput } from './FormInput';

export function SignUpForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' || (typeof window !== 'undefined' && width < 768);

  return (
    <View className="w-full">
      {/* Heading */}
      <View className="items-center mb-7">
        <Text 
          className="font-jost-semibold text-base mb-1"
          style={{ color: theme.text }}
        >
          Junte-se à nós
        </Text>
        <Text 
          className={`font-khand-bold font-bold uppercase text-center ${
            isMobile ? 'text-4xl' : 'text-5xl'
          }`}
          style={{ color: theme.text, lineHeight: isMobile ? 36 : 42 }}
        >
          GERENCIE, ANALISE E CRESÇA
        </Text>
      </View>

      {/* Inputs */}
      <View className="mb-1">
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
      <TouchableOpacity className="items-center mt-1 mb-5" activeOpacity={0.7} onPress={onToggleForm}>
        <Text 
          className="font-jost-semibold text-sm underline"
          style={{ color: theme.text }}
        >
          Entrar na conta
        </Text>
      </TouchableOpacity>

      {/* Social buttons */}
      <View className="flex-row justify-center gap-3">
        <FormButton variant="social" socialIcon="facebook-f" style={{ width: 48, paddingHorizontal: 0, marginBottom: 0 }} />
        <FormButton variant="social" socialIcon="google" style={{ width: 48, paddingHorizontal: 0, marginBottom: 0 }} />
      </View>
    </View>
  );
}
