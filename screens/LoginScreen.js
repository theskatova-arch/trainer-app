import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  // Состояния для полей ввода
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Функция входа
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      Alert.alert('Успех!', 'Добро пожаловать!');
      navigation.replace('Home');
      
    } catch (error) {
      Alert.alert('Ошибка входа', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Функция регистрации с проверкой пароля
  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    // Проверяем требования к паролю
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      Alert.alert('Ошибка', passwordErrors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      Alert.alert(
        'Успешная регистрация!', 
        'Теперь вы можете войти в приложение',
        [
          { 
            text: 'ОК', 
            onPress: () => {
              setIsLogin(true);
              setPassword('');
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Ошибка регистрации', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Функция проверки пароля
  const validatePassword = (pass) => {
    const errors = [];
    
    if (pass.length < 6) {
      errors.push('• Минимум 6 символов');
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('• Хотя бы одна заглавная буква (A-Z)');
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('• Хотя бы одна строчная буква (a-z)');
    }
    if (!/[0-9]/.test(pass)) {
      errors.push('• Хотя бы одна цифра (0-9)');
    }
    if (!/[!@#$%^&*]/.test(pass)) {
      errors.push('• Хотя бы один спецсимвол (!@#$%^&*)');
    }
    
    return errors;
  };

  // Проверяем, соответствует ли пароль требованиям (для отображения галочек)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Введите пароль', color: '#8E8E93' };
    
    const checks = [
      pass.length >= 6,
      /[A-Z]/.test(pass),
      /[a-z]/.test(pass),
      /[0-9]/.test(pass),
      /[!@#$%^&*]/.test(pass)
    ];
    
    const score = checks.filter(Boolean).length;
    
    if (score === 0) return { score, label: 'Введите пароль', color: '#8E8E93' };
    if (score <= 2) return { score, label: 'Слабый пароль', color: '#FF3B30' };
    if (score <= 3) return { score, label: 'Средний пароль', color: '#FF9500' };
    if (score <= 4) return { score, label: 'Хороший пароль', color: '#34C759' };
    return { score, label: 'Отличный пароль!', color: '#007AFF' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Переключаем между входом и регистрацией
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setPassword('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Заголовок */}
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.title}>
            {isLogin ? 'Добро пожаловать!' : 'Создайте аккаунт'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Войдите, чтобы продолжить чтение' 
              : 'Начните отслеживать свои книги'}
          </Text>

          {/* Поле для email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.ru"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {/* Поле для пароля */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Пароль</Text>
            <TextInput
              style={styles.input}
              placeholder="Придумайте надёжный пароль"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            
            {/* Показываем подсказку только при регистрации */}
            {!isLogin && password && (
              <View style={styles.passwordHint}>
                <Text style={styles.passwordStrength}>
                  Сложность: <Text style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </Text>
                </Text>
                
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill, 
                      { 
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }
                    ]} 
                  />
                </View>
              </View>
            )}

            {/* Требования к паролю (всегда показываем при регистрации) */}
            {!isLogin && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>
                  Пароль должен содержать:
                </Text>
                <View style={styles.requirement}>
                  <Text style={[
                    styles.requirementIcon,
                    password.length >= 6 ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {password.length >= 6 ? '✅' : '⬜'}
                  </Text>
                  <Text style={[
                    styles.requirementText,
                    password.length >= 6 ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    Минимум 6 символов
                  </Text>
                </View>
                <View style={styles.requirement}>
                  <Text style={[
                    styles.requirementIcon,
                    /[A-Z]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {/[A-Z]/.test(password) ? '✅' : '⬜'}
                  </Text>
                  <Text style={[
                    styles.requirementText,
                    /[A-Z]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    Заглавная буква (A-Z)
                  </Text>
                </View>
                <View style={styles.requirement}>
                  <Text style={[
                    styles.requirementIcon,
                    /[a-z]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {/[a-z]/.test(password) ? '✅' : '⬜'}
                  </Text>
                  <Text style={[
                    styles.requirementText,
                    /[a-z]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    Строчная буква (a-z)
                  </Text>
                </View>
                <View style={styles.requirement}>
                  <Text style={[
                    styles.requirementIcon,
                    /[0-9]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {/[0-9]/.test(password) ? '✅' : '⬜'}
                  </Text>
                  <Text style={[
                    styles.requirementText,
                    /[0-9]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    Цифра (0-9)
                  </Text>
                </View>
                <View style={styles.requirement}>
                  <Text style={[
                    styles.requirementIcon,
                    /[!@#$%^&*]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {/[!@#$%^&*]/.test(password) ? '✅' : '⬜'}
                  </Text>
                  <Text style={[
                    styles.requirementText,
                    /[!@#$%^&*]/.test(password) ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    Спецсимвол (!@#$%^&*)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Кнопка входа/регистрации */}
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Кнопка переключения режима */}
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={toggleMode}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin 
                ? 'Нет аккаунта? Зарегистрируйтесь' 
                : 'Уже есть аккаунт? Войдите'}
            </Text>
          </TouchableOpacity>

          {/* Маленькая подсказка */}
          <Text style={styles.hint}>
            {isLogin 
              ? 'Введите email и пароль' 
              : 'Все поля обязательны для заполнения'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    fontSize: 50,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F8F8FC',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
  },
  hint: {
    marginTop: 20,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Новые стили для подсказок по паролю
  passwordHint: {
    marginTop: 8,
  },
  passwordStrength: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F8FC',
    borderRadius: 10,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  requirementIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  requirementText: {
    fontSize: 13,
  },
  requirementMet: {
    color: '#34C759',
  },
  requirementNotMet: {
    color: '#8E8E93',
  },
});

