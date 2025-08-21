import React, { useState } from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import AuthService, { LoginCredentials, RegisterCredentials } from '@/services/AuthService';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAuth = async (): Promise<void> => {
    router.push(isLogin ? './AuthScreen' : './RegistrationScreen');
    setIsLoading(true);

    try {
      let result;
      
      if (isLogin) {
        const credentials: LoginCredentials = { email, password };
        result = await AuthService.login(credentials);
      } else {
        const credentials: RegisterCredentials = { email, password, username };
        result = await AuthService.register(credentials);
      }

      if (result.success) {
        Alert.alert('Success', result.message);
        console.log('User data:', result.user);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = (): void => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const isFormValid = (): boolean => {
    if (isLogin) {
      return email.length > 0 && password.length > 0;
    } else {
      return email.length > 0 && password.length > 0 && username.length > 0;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isLogin ? 'Login' : 'Register'}
      </Text>

      {!isLogin && (
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          editable={!isLoading}
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        editable={!isLoading}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        editable={!isLoading}
      />

      <TouchableOpacity 
        onPress={handleAuth} 
        disabled={isLoading || !isFormValid()}
        style={[
          styles.authButton, 
          (isLoading || !isFormValid()) && styles.disabledButton
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.authButtonText}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={toggleAuthMode} 
        style={styles.switchButton}
        disabled={isLoading}
      >
        <Text style={styles.switchButtonText}>
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  authButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  authButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#007bff',
    fontSize: 14,
  },
});

export default AuthScreen;