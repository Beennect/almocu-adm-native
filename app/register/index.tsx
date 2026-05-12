import { Feather, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [nameError, setNameError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // Validar nome
    if (name.trim() === '') {
      setNameError('Por favor, informe seu nome');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Informe um e-mail válido');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Validar senha
    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('As senhas não coincidem');
      isValid = false;
    } else {
      setPasswordError('');
      setConfirmError('');
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    // Aqui você faria o cadastro real
    console.log('Cadastrando usuário:', { name, email, password });
    Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
    router.push('/login');
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="py-8 items-center justify-center"
      >
        <Text className="text-white text-3xl font-bold">Crie sua conta</Text>
        <Text className="text-blue-100 text-base text-center mt-2">
          Comece sua jornada conosco hoje
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-5 py-5">
        <View className="px-5">
          {/* Nome */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 py-3 mb-4 border border-gray-300">
            <Feather name="user" size={20} color="#667eea" />
            <TextInput
              className="flex-1 ml-3 text-base"
              placeholder="Seu nome completo"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {nameError && <Text className="text-red-600 text-xs ml-3">{nameError}</Text>}
          </View>

          {/* E-mail */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 py-3 mb-4 border border-gray-300">
            <Feather name="mail" size={20} color="#667eea" />
            <TextInput
              className="flex-1 ml-3 text-base"
              placeholder="Seu e-mail"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            {emailError && <Text className="text-red-600 text-xs ml-3">{emailError}</Text>}
          </View>

          {/* Senha */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 py-3 mb-4 border border-gray-300">
            <Feather name="lock" size={20} color="#667eea" />
            <TextInput
              className="flex-1 ml-3 text-base"
              placeholder="Sua senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {passwordError && <Text className="text-red-600 text-xs ml-3">{passwordError}</Text>}
          </View>

          {/* Confirmar Senha */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 py-3 mb-4 border border-gray-300">
            <Feather name="shield" size={20} color="#667eea" />
            <TextInput
              className="flex-1 ml-3 text-base"
              placeholder="Confirmar senha"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            {confirmError && <Text className="text-red-600 text-xs ml-3">{confirmError}</Text>}
          </View>

          {/* Botão de Registro */}
          <TouchableOpacity
            className="bg-blue-500 py-4 rounded-2xl items-center mb-6"
            style={!validateForm() ? { opacity: 0.5 } : {}}
            onPress={handleRegister}
          >
            <Text className="text-white text-lg font-bold">Cadastrar</Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-500 mb-4">Ou cadastre-se com</Text>

          {/* Botões sociais */}
          <View className="flex-row justify-center gap-4 mb-8">
            <TouchableOpacity
              className="flex-row items-center bg-white px-4 py-3 rounded-2xl border border-gray-300"
              onPress={() => Alert.alert('Google', 'Funcionalidade em desenvolvimento')}
            >
              <FontAwesome name="google" size={24} color="#667eea" />
              <Text className="ml-2 text-gray-700 text-base font-semibold">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center bg-white px-4 py-3 rounded-2xl border border-gray-300"
              onPress={() => Alert.alert('Facebook', 'Funcionalidade em desenvolvimento')}
            >
              <FontAwesome name="facebook" size={24} color="#4267B2" />
              <Text className="ml-2 text-gray-700 text-base font-semibold">Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Já tem conta */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-sm">Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text className="text-blue-600 text-sm font-bold">Faça login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}