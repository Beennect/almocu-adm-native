import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
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
    // navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>
          Comece sua jornada conosco hoje
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="#667eea" />
            <TextInput
              style={styles.input}
              placeholder="Seu nome completo"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {nameError && <Text style={styles.error}>{nameError}</Text>}
          </View>

          {/* E-mail */}
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#667eea" />
            <TextInput
              style={styles.input}
              placeholder="Seu e-mail"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            {emailError && <Text style={styles.error}>{emailError}</Text>}
          </View>

          {/* Senha */}
          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#667eea" />
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {passwordError && <Text style={styles.error}>{passwordError}</Text>}
          </View>

          {/* Confirmar Senha */}
          <View style={styles.inputContainer}>
            <Feather name="shield" size={20} color="#667eea" />
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            {confirmError && <Text style={styles.error}>{confirmError}</Text>}
          </View>

          {/* Botão de Registro */}
          <TouchableOpacity
            style={[styles.button, !validateForm() && styles.buttonDisabled]}
            onPress={handleRegister}
          >
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>Ou cadastre-se com</Text>

          {/* Botões sociais */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('Google', 'Funcionalidade em desenvolvimento')}
            >
              <Feather name="google" size={24} color="#fff" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('Facebook', 'Funcionalidade em desenvolvimento')}
            >
              <Feather name="facebook" size={24} color="#fff" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Já tem conta */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Faça login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e8eaf6',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: '#e53935',
    fontSize: 12,
    marginLeft: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#c5cae9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  socialText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  loginText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
  },
});