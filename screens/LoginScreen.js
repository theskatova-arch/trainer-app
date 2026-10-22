import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// Палитра 2027
const LIME_ACCENT = '#B2D100'; 
const PURPLE_GLOW = '#6B46C1';
const ERROR_COLOR = '#FF3B30'; // Неоновый красный для ошибок
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // 👇 Состояния для кастомного модального окна 👇
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', isError: true });

  // Вспомогательная функция для показа окна
  const showModal = (title, message, isError = true) => {
    setModalConfig({ title, message, isError });
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;
    } catch (error) {
      showModal('Ошибка входа', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !username) {
      showModal('Ошибка', 'Заполните все поля');
      return;
    }

    if (password.length < 6) {
      showModal('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

        try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            username: username.trim(),
            display_name: username.trim() // 👈 ДОБАВИЛИ ВОТ ЭТУ СТРОКУ
          }
        }
      });

      if (error) throw error;

      // При успехе тоже используем красивое окно
      showModal('Успешно', 'Аккаунт создан! Теперь вы можете войти.', false);
      
      setIsLogin(true);
      setPassword('');
      
    } catch (error) {
      showModal('Ошибка регистрации', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Введите пароль', color: TEXT_MUTED };
    const length = pass.length;
    if (length < 6) return { score: 1, label: 'Слишком короткий', color: ERROR_COLOR };
    if (length < 8) return { score: 2, label: 'Нормальный', color: '#FF9500' };
    if (length < 12) return { score: 3, label: 'Хороший', color: LIME_ACCENT };
    return { score: 4, label: 'Отличный пароль!', color: LIME_ACCENT };
  };

  const passwordStrength = getPasswordStrength(password);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setPassword('');
    setUsername('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      <View style={styles.auraLime} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <Text style={styles.title}>
              {isLogin ? 'С возвращением' : 'Создай аккаунт'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Твой личный трекер чтения ждет' 
                : 'Начни свой путь в мире книг'}
            </Text>

                        {/* 👇 Поле Никнейма (только при регистрации) 👇 */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>НИКНЕЙМ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Как тебя называть?"
                  placeholderTextColor={TEXT_MUTED}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
                  maxLength={23} 
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="example@mail.ru"
                placeholderTextColor={TEXT_MUTED}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>ПАРОЛЬ</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={TEXT_MUTED}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              
              {!isLogin && password && (
                <View style={styles.passwordHint}>
                  <Text style={styles.passwordStrength}>
                    Сложность: <Text style={{ color: passwordStrength.color }}>{passwordStrength.label}</Text>
                  </Text>
                  <View style={styles.strengthBar}>
                    <View style={[styles.strengthFill, { width: `${(passwordStrength.score / 4) * 100}%`, backgroundColor: passwordStrength.color }]} />
                  </View>
                </View>
              )}

              {!isLogin && (
                <View style={styles.requirementsContainer}>
                  <View style={styles.requirement}>
                    <Ionicons name={password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={password.length >= 6 ? LIME_ACCENT : TEXT_MUTED} style={{ marginRight: 8 }} />
                    <Text style={[styles.requirementText, password.length >= 6 && { color: LIME_ACCENT }]}>
                      Минимум 6 символов
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={isLogin ? handleLogin : handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={BG_DARK} /> : <Text style={styles.buttonText}>{isLogin ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchButton} onPress={toggleMode} disabled={loading}>
              <Text style={styles.switchText}>
                {isLogin ? 'Нет аккаунта? Зарегистрируйся' : 'Уже есть аккаунт? Войди'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 👇 КАСТОМНОЕ МОДАЛЬНОЕ ОКНО 👇 */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={[styles.modalGlass, { borderColor: modalConfig.isError ? ERROR_COLOR : LIME_ACCENT }]}>
            
            <Ionicons 
              name={modalConfig.isError ? "alert-circle" : "checkmark-circle"} 
              size={48} 
              color={modalConfig.isError ? ERROR_COLOR : LIME_ACCENT} 
              style={{ marginBottom: 16 }}
            />
            
            <Text style={[styles.modalTitle, { color: modalConfig.isError ? ERROR_COLOR : LIME_ACCENT }]}>
              {modalConfig.title}
            </Text>
            
            <Text style={styles.modalMessage}>
              {modalConfig.message}
            </Text>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: modalConfig.isError ? ERROR_COLOR : LIME_ACCENT }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>ПОНЯТНО</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  auraPurple: { position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: PURPLE_GLOW, opacity: 0.3 },
  auraLime: { position: 'absolute', bottom: -100, right: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: LIME_ACCENT, opacity: 0.15 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 32, padding: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  title: { fontSize: 28, fontFamily: 'PlusJakartaSans_800ExtraBold', textAlign: 'center', color: TEXT_WHITE, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, textAlign: 'center', marginBottom: 32 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_MUTED, marginBottom: 8, letterSpacing: 1.5 },
  input: { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 16, fontSize: 16, color: TEXT_WHITE, fontFamily: 'PlusJakartaSans_400Regular', backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  button: { backgroundColor: LIME_ACCENT, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: BG_DARK, fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: 1 },
  switchButton: { marginTop: 24, padding: 10 },
  switchText: { color: TEXT_WHITE, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' },
  passwordHint: { marginTop: 12 },
  passwordStrength: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, marginBottom: 6 },
  strengthBar: { height: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  requirementsContainer: { marginTop: 12, padding: 12, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  requirement: { flexDirection: 'row', alignItems: 'center' },
  requirementText: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED },

  // 👇 Стили для кастомного модального окна 👇
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalGlass: {
    width: '80%',
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: TEXT_WHITE,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: BG_DARK,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15,
  },
});