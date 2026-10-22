import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';
import { fetchBooks } from '../services/bookService';

const LIME_ACCENT = '#B2D100'; 
const PURPLE_GLOW = '#6B46C1';
const PEACH_GLOW = '#FF8C69';  
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';


export default function HomeScreen({ navigation, user, wantBooks = [], onMoveToReading, allBooks = [] }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [goal, setGoal] = useState(0);
  const [readThisYear, setReadThisYear] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // 1. Получаем пользователя
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 2. Получаем цель из метаданных
      if (user) {
        const userGoal = Number(user.user_metadata?.reading_goal) || 0;
        setGoal(userGoal);
      }

      // 3. Получаем книги и считаем прочитанные за год
      try {
        const books = await fetchBooks();
        const currentYear = new Date().getFullYear();
        const read = books.filter(b => {
          if (b.status !== 'read' || !b.finish_date) return false;
          return b.finish_date.includes(currentYear.toString());
        });
        setReadThisYear(read.length);
      } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
      }
    });
    return unsubscribe;
  }, [navigation]);

  const username = currentUser?.user_metadata?.username 
    || currentUser?.user_metadata?.display_name 
    || currentUser?.user_metadata?.['Display name'] 
    || (currentUser?.email ? currentUser.email.split('@')[0] : 'Читатель');
  
  const progressPercent = goal > 0 ? Math.min((readThisYear / goal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      <View style={styles.auraPeach} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Шапка с приветствием и шестеренкой */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.greeting}>Привет,</Text>
            <Text style={styles.username} numberOfLines={2}>
              {username}.
            </Text>
          </View>
          
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={TEXT_WHITE} />
          </TouchableOpacity>
        </View>

        {/* Карточка цели */}
        <TouchableOpacity style={styles.goalCardWrapper} activeOpacity={0.9} onPress={() => navigation.navigate('MyGoal')}>
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconBg}>
                <Ionicons name="sparkles" size={20} color={LIME_ACCENT} />
              </View>
              <Text style={styles.goalLabel}>ЦЕЛЬ НА ГОД</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.goalNumber}>{goal > 0 ? goal : '—'}</Text>
              <Text style={styles.goalUnit}> книг</Text>
            </View>
            
            <Text style={styles.goalSub}>
              {goal > 0 ? `Прочитано: ${readThisYear} из ${goal}` : 'Нажми, чтобы установить цель'}
            </Text>
            
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
          </BlurView>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Твоя библиотека</Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCardWrapper} activeOpacity={0.9} onPress={() => navigation.navigate('Tracker')}>
            <BlurView intensity={15} tint="dark" style={styles.glassCardSmall}>
              <Ionicons name="book-outline" size={28} color={TEXT_WHITE} style={{ marginBottom: 16 }} />
              <Text style={styles.cardTitle}>Мои книги</Text>
              <Text style={styles.cardSub}>Трекер чтения</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCardWrapper} activeOpacity={0.9} onPress={() => navigation.navigate('Community')}>
            <BlurView intensity={15} tint="dark" style={styles.glassCardSmall}>
              <Ionicons name="planet-outline" size={28} color={PEACH_GLOW} style={{ marginBottom: 16 }} />
              <Text style={styles.cardTitle}>Комьюнити</Text>
              <Text style={styles.cardSub}>Лента друзей</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* НОВАЯ КНОПКА "ЧТО ПОЧИТАТЬ" */}
        <TouchableOpacity 
          style={styles.whatToReadCard} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('WhatToRead', { 
            wantBooks: wantBooks, 
            onMoveToReading: onMoveToReading,
            allBooks: allBooks 
          })}
        >
          <BlurView intensity={20} tint="dark" style={styles.whatToReadGlass}>
            <View style={styles.whatToReadIcon}>
              <Ionicons name="sparkles" size={28} color={LIME_ACCENT} />
            </View>
            <View style={styles.whatToReadText}>
              <Text style={styles.cardTitle}>Что почитать?</Text>
              <Text style={styles.cardSub}>Полная библиотека приложения</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={TEXT_MUTED} />
          </BlurView>
        </TouchableOpacity>

        {/* Блок с юмором от ИИ и переходом в ТГ */}
        <BlurView intensity={20} tint="dark" style={styles.aiBlock}>
          <View style={styles.aiHeader}>
            <Ionicons name="hardware-chip-outline" size={18} color={LIME_ACCENT} />
            <Text style={styles.aiLabel}>НЕЙРО-СОВЕТ</Text>
          </View>
          
          <Text style={styles.aiText}>
            ИИ проанализировал твои предпочтения и рекомендует тебе Telegram-канал <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE }}>«Непопулярный книжный клуб»</Text>. Там пишут отзывы на книги
          </Text>
          
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => Linking.openURL('https://t.me/nopopular_books_club')}
          >
            <Text style={styles.aiButtonText}>Вступить в клуб</Text>
            <Ionicons name="arrow-forward" size={16} color={BG_DARK} />
          </TouchableOpacity>
        </BlurView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  scrollContent: { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, zIndex: 2 },

  auraPurple: { position: 'absolute', top: -50, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: PURPLE_GLOW, opacity: 0.3 },
  auraPeach: { position: 'absolute', bottom: 100, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: PEACH_GLOW, opacity: 0.15 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  greeting: { fontSize: 18, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, marginBottom: 4 },
  
  // 👇 Уменьшили размер шрифта и добавили lineHeight для двух строк 👇
  username: { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, letterSpacing: -0.5, lineHeight: 38 },
  
  sectionTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE, marginTop: 20, marginBottom: 16 },

  goalCardWrapper: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 20 },
  glassCard: { padding: 24, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  goalIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(178, 209, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  goalLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: LIME_ACCENT, letterSpacing: 1 },
  
  goalNumber: { fontSize: 56, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, lineHeight: 60 },
  goalUnit: { fontSize: 20, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_MUTED, marginLeft: 6 },
  goalSub: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, marginBottom: 24 },
  
  progressTrack: { height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4, backgroundColor: LIME_ACCENT },

  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  gridCardWrapper: { width: '48%', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  glassCardSmall: { padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.02)', height: 140, justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE, marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED },

  whatToReadCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(178, 209, 0, 0.3)',
    marginBottom: 30,
    backgroundColor: 'rgba(178, 209, 0, 0.05)',
  },
  whatToReadGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  whatToReadIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(178, 209, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  whatToReadText: {
    flex: 1,
  },

  aiBlock: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(107, 70, 193, 0.3)', backgroundColor: 'rgba(107, 70, 193, 0.1)', padding: 24, marginTop: 10 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_800ExtraBold', color: LIME_ACCENT, letterSpacing: 1.5, marginLeft: 8 },
  aiText: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_WHITE, lineHeight: 24, marginBottom: 16 },
  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIME_ACCENT, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start' },
  aiButtonText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#000', marginRight: 8 },
});