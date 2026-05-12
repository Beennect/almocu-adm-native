import { EmailIcon, KeyIcon, ShieldCheckIcon, UserIcon } from '@/components/shared/Icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';

export function SignUpForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  return (
    <View className="w-full self-center">
      {/* Heading */}
      <View className="items-center mb-7">
        <Text className="font-[Jost_600SemiBold] text-base text-text mb-1">Junte-se à nós</Text>
        <Text className="font-[Khand_700Bold] text-[36px] md:text-[42px] font-bold text-text text-center uppercase leading-[36px] md:leading-[42px]">
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
        <Text className="font-[Jost_600SemiBold] text-sm text-text underline">Entrar na conta</Text>
      </TouchableOpacity>

      {/* Social buttons */}
      <View className="flex-row justify-center gap-3">
        <FormButton variant="social" socialIcon="facebook-f" className="w-12 px-0 mb-0" />
        <FormButton variant="social" socialIcon="google" className="w-12 px-0 mb-0" />
      </View>
    </View>
  );
}
