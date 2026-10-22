import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { fetchUserBooks } from '../services/bookService';
import { supabase } from '../lib/supabase'; // 👈 Добавили импорт

// Палитра 2027
const LIME_ACCENT = '#B2D100';
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

export default function UserProfileScreen({ route, navigation }) {
  const { userId, username } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('want'); 
  const [books, setBooks] = useState([]);
  
  // 👇 Новые состояния для цели 👇
  const [goal, setGoal] = useState(0);
  const [readThisYear, setReadThisYear] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

    const loadData = async () => {
    setLoading(true);
    
    try {
      // 1. Получаем книги пользователя
      const userBooks = await fetchUserBooks(userId);
      setBooks(userBooks);

      // 2. Считаем прочитанные за текущий год
      const currentYear = new Date().getFullYear();
      const read = userBooks.filter(b => {
        if (b.status !== 'read' || !b.finish_date) return false;
        return String(b.finish_date).includes(currentYear.toString());
      });
      setReadThisYear(read.length);

      // 3. Получаем цель из метаданных пользователя
      const { data: goalData, error: goalError } = await supabase.rpc('get_user_goal', { target_user_id: userId });
      
      console.log('🎯 Цель из базы:', goalData);
      if (goalError) console.error('Ошибка получения цели:', goalError);
      
      if (goalData) setGoal(goalData);

    } catch (error) {
      console.error('Ошибка загрузки данных профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(b => b.status === activeTab);

  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookItemWrapper}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('BookDetail', { 
        book: item, 
        isReadOnly: true
      })}
    >
      <BlurView intensity={10} tint="dark" style={styles.bookItemGlass}>
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverText}>{item.title.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={TEXT_MUTED} />
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      <View style={styles.auraLime} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 👇 БЛОК ЦЕЛИ 👇 */}
      <BlurView intensity={20} tint="dark" style={styles.goalBlock}>
        <Text style={styles.goalTitle}>Цель на год</Text>
        <Text style={styles.goalText}>
          Прочитано: <Text style={styles.goalHighlight}>{readThisYear}</Text> книг из <Text style={styles.goalHighlight}>{goal || '—'}</Text>
        </Text>
      </BlurView>

      <BlurView intensity={20} tint="dark" style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'want' && styles.activeTab]} 
          onPress={() => setActiveTab('want')}
        >
          <Text style={[styles.tabText, activeTab === 'want' && styles.activeTabText]}>Хочу</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reading' && styles.activeTab]} 
          onPress={() => setActiveTab('reading')}
        >
          <Text style={[styles.tabText, activeTab === 'reading' && styles.activeTabText]}>Читаю</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'read' && styles.activeTab]} 
          onPress={() => setActiveTab('read')}
        >
          <Text style={[styles.tabText, activeTab === 'read' && styles.activeTabText]}>Прочитал</Text>
        </TouchableOpacity>
      </BlurView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={LIME_ACCENT} />
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBookItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>В этом списке пока пусто</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Ауры
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
  auraLime: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: LIME_ACCENT,
    opacity: 0.1,
  },

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 70 : 50, 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    zIndex: 2,
  },
  backButton: { padding: 5 },
  headerTitle: { 
    fontSize: 20, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    color: TEXT_WHITE 
  },

  // 👇 Стили для блока цели 👇
  goalBlock: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(178, 209, 0, 0.3)',
    backgroundColor: 'rgba(178, 209, 0, 0.05)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  goalText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: TEXT_WHITE,
  },
  goalHighlight: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: LIME_ACCENT,
    fontSize: 18,
  },

  tabsContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginBottom: 20, 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  tab: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: { 
    borderBottomColor: LIME_ACCENT,
    backgroundColor: 'rgba(178, 209, 0, 0.05)',
  },
  tabText: { 
    fontSize: 14, 
    fontFamily: 'PlusJakartaSans_600SemiBold', 
    color: TEXT_MUTED 
  },
  activeTabText: { 
    color: TEXT_WHITE,
    textShadowColor: 'rgba(178, 209, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 40, zIndex: 2 },
  
  bookItemWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bookItemGlass: { 
    flexDirection: 'row', 
    padding: 16, 
    alignItems: 'center' 
  },
  
  coverPlaceholder: { 
    width: 40, 
    height: 56, 
    backgroundColor: 'rgba(178, 209, 0, 0.1)', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(178, 209, 0, 0.3)'
  },
  coverText: { 
    color: LIME_ACCENT, 
    fontSize: 18, 
    fontFamily: 'PlusJakartaSans_800ExtraBold' 
  },
  
  bookInfo: { flex: 1 },
  bookTitle: { 
    fontSize: 16, 
    fontFamily: 'PlusJakartaSans_600SemiBold', 
    color: TEXT_WHITE, 
    marginBottom: 4 
  },
  bookAuthor: { 
    fontSize: 13, 
    fontFamily: 'PlusJakartaSans_400Regular', 
    color: TEXT_MUTED 
  },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { 
    textAlign: 'center', 
    color: TEXT_MUTED, 
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15
  }
});