import { EmailIcon, KeyIcon } from '@/components/shared/Icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';

export function LoginForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View className="w-full self-center">
      {/* Heading */}
      <View className="items-center mb-8">
        <Text className="font-[Jost_600SemiBold] text-base text-text mb-2">Bem-vindo(a) de volta!</Text>
        <Text className="font-[Khand_700Bold] text-[36px] md:text-[42px] font-bold text-text text-center uppercase leading-[36px] md:leading-[42px]">
          ACESSE SEU PAINEL
        </Text>
      </View>

      {/* Inputs */}
      <View className="mb-1">
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
      <TouchableOpacity className="items-center mt-1 mb-5" activeOpacity={0.7} onPress={onToggleForm}>
        <Text className="font-[Jost_600SemiBold] text-sm text-text underline">Criar conta</Text>
      </TouchableOpacity>

      {/* Social buttons */}
      <View className="gap-2">
        <FormButton title="Entrar com o Facebook" variant="social" socialIcon="facebook-f" />
        <FormButton title="Entrar com o Google" variant="social" socialIcon="google" />
      </View>
    </View>
  );
}
