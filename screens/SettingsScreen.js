import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const LIME_ACCENT = '#B2D100'; 
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

export default function SettingsScreen({ navigation, user, onUpdateUser }) {
  const initialUsername = user?.user_metadata?.username 
    || user?.user_metadata?.display_name 
    || user?.user_metadata?.['Display name'] 
    || '';

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

    const updateProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Ошибка', 'Никнейм не может быть пустым');
      return;
    }

    setLoadingProfile(true);
    try {
      // 👇 Сохраняем ник в username и display_name одновременно 👇
      const updates = {
        data: { 
          username: username.trim(),
          display_name: username.trim(),
          'Display name': username.trim() 
        },
      };

      if (email.trim() !== user?.email) {
        updates.email = email.trim();
      }

      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      if (onUpdateUser && data?.user) {
        // Обновляем стейт, чтобы приложение сразу увидело новый ник
        onUpdateUser({
          ...data.user,
          user_metadata: { 
            ...data.user.user_metadata, 
            username: username.trim(),
            display_name: username.trim()
          }
        });
      }

      if (email.trim() !== user?.email) {
        Alert.alert('Внимание', 'Проверьте почту для подтверждения нового email.');
      }

    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });

      if (error) throw error;

      Alert.alert('Успех', 'Пароль успешно изменен!');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Профиль</Text>
        <BlurView intensity={20} tint="dark" style={styles.block}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>НИКНЕЙМ</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Введите никнейм"
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Введите email"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loadingProfile && { opacity: 0.7 }]} 
            onPress={updateProfile}
            disabled={loadingProfile}
          >
            {loadingProfile ? <ActivityIndicator color={BG_DARK} /> : <Text style={styles.saveButtonText}>СОХРАНИТЬ ПРОФИЛЬ</Text>}
          </TouchableOpacity>
        </BlurView>

        <Text style={styles.sectionTitle}>Безопасность</Text>
        <BlurView intensity={20} tint="dark" style={styles.block}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>НОВЫЙ ПАРОЛЬ</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Минимум 6 символов"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loadingPassword && { opacity: 0.7 }]} 
            onPress={updatePassword}
            disabled={loadingPassword}
          >
            {loadingPassword ? <ActivityIndicator color={BG_DARK} /> : <Text style={styles.saveButtonText}>СМЕНИТЬ ПАРОЛЬ</Text>}
          </TouchableOpacity>
        </BlurView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  auraPurple: {
    position: 'absolute',
    top: -50,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PURPLE_GLOW,
    opacity: 0.15,
  },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 15, paddingHorizontal: 20, 
    zIndex: 2,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { 
    fontSize: 14, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    color: LIME_ACCENT, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5, 
    marginBottom: 12, 
    marginTop: 10 
  },
  
  block: { 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 24, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  inputGroup: { marginBottom: 16 },
  label: { 
    fontSize: 11, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    color: TEXT_MUTED, 
    marginBottom: 8, 
    letterSpacing: 1 
  },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    color: TEXT_WHITE, 
    fontFamily: 'PlusJakartaSans_400Regular' 
  },
  
  saveButton: { 
    backgroundColor: LIME_ACCENT, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10 
  },
  saveButtonText: { 
    color: BG_DARK, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    fontSize: 15 
  },
});