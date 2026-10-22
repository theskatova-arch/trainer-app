import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  ScrollView,
  Dimensions
} from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';
import { fetchBooks } from '../services/bookService';
import Svg, { Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SCREEN_PADDING = 30;
const SHELF_INNER_PADDING = 10;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (SCREEN_PADDING * 2) - (SHELF_INNER_PADDING * 2);

const SHELF_HEIGHT = 120; 

// Палитра 2027
const LIME_ACCENT = '#B2D100';
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';

// Цвета для книг (неоновые оттенки на темном фоне)
const BOOK_COLORS = [
  '#CCFF00', '#6B46C1', '#FF8C69', '#00F0FF', '#FF00AA', 
  '#FFD700', '#00FF88', '#FF3366', '#8A2BE2', '#4B0082'
];

const SvgBook = ({ isRead, colorIndex, height, width, gap }) => {
  // Если не прочитана — делаем более светлый серый с полупрозрачным контуром
  const fillColor = isRead ? BOOK_COLORS[colorIndex % BOOK_COLORS.length] : 'rgba(255, 255, 255, 0.15)'; 
  const borderColor = isRead ? fillColor : 'rgba(255, 255, 255, 0.4)';

  return (
    <Svg width={width} height={height} style={{ marginRight: gap }}>
      <Rect x="0" y="0" width={width} height={height} rx="2" fill={fillColor} stroke={borderColor} strokeWidth="1" />
      {/* Блик (только для прочитанных) */}
      {isRead && (
        <Rect x="1" y="4" width={width - 2} height={height - 8} rx="1" fill="rgba(255,255,255,0.3)" />
      )}
    </Svg>
  );
};

export default function MyGoalScreen({ navigation }) {
  const insets = useSafeAreaInsets(); 

  const [goal, setGoal] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booksReadThisYear, setBooksReadThisYear] = useState(0);
  const [bookLayout, setBookLayout] = useState([]);
  const saveTimeout = useRef(null);

  const goalOptions = [];
  for (let i = 5; i <= 100; i += 5) {
    goalOptions.push({ label: `${i}`, value: i });
  }

  const calculateBookSizes = (maxBooksInRow) => {
    const effectiveBooksCount = Math.min(maxBooksInRow, 22); 
    const totalGapWidth = (effectiveBooksCount - 1) * 4; 
    const bookWidth = (AVAILABLE_WIDTH - totalGapWidth) / effectiveBooksCount;

    return {
      baseWidth: Math.max(6, Math.min(18, bookWidth)),
    };
  };

  const generateLayout = (currentGoal, readCount) => {
    if (currentGoal === 0) return;

    let shelvesCount = 1;
    if (currentGoal >= 20 && currentGoal <= 40) shelvesCount = 2;
    else if (currentGoal >= 45 && currentGoal <= 55) shelvesCount = 3;
    else if (currentGoal >= 60 && currentGoal <= 100) shelvesCount = 5;

    let allBooks = Array.from({ length: currentGoal }, (_, i) => ({ id: i, isRead: false }));

    const actualReadCount = Math.min(readCount, currentGoal);
    if (actualReadCount > 0) {
      let indices = allBooks.map(b => b.id);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let i = 0; i < actualReadCount; i++) {
        allBooks[indices[i]].isRead = true;
      }
    }

    const shelfCounts = new Array(shelvesCount).fill(0);
    let booksLeft = currentGoal;
    
    for (let i = 0; i < shelvesCount; i++) {
      if (booksLeft > 0) {
        shelfCounts[i] += 1;
        booksLeft--;
      }
    }
    while (booksLeft > 0) {
      const randomShelf = Math.floor(Math.random() * shelvesCount);
      if (shelfCounts[randomShelf] < Math.ceil(currentGoal / shelvesCount) + 2) {
        shelfCounts[randomShelf] += 1;
        booksLeft--;
      }
    }

    const shelves = [];
    let bookIndex = 0;
    
    for (let i = 0; i < shelvesCount; i++) {
      const count = shelfCounts[i];
      const shelfBooks = allBooks.slice(bookIndex, bookIndex + count);
      bookIndex += count;

      const shelfItems = shelfBooks.map((book) => {
        const widthMultiplier = 0.7 + (Math.random() * 0.6);
        const gap = Math.floor(Math.random() * 6) + 1; 
        const height = 65 + Math.floor(Math.random() * 31);

        return { 
          type: 'book', 
          ...book, 
          widthMultiplier,
          gap,
          height
        };
      });
      
      shelves.push(shelfItems);
    }

    const maxItemsInShelf = Math.max(...shelves.map(s => s.length));
    const sizes = calculateBookSizes(maxItemsInShelf);

    setBookLayout({ shelves, sizes });
  };

    useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 👇 ЗАПУСКАЕМ ЗАПРОСЫ ПАРАЛЛЕЛЬНО (одновременно) 👇
        const [userResponse, allBooks] = await Promise.all([
          supabase.auth.getUser(),
          fetchBooks()
        ]);

        const user = userResponse.data?.user;
        let currentGoal = 5;
        
        // 1. Быстро достаем цель из уже полученного объекта пользователя
        if (user) {
          const savedGoal = user.user_metadata?.reading_goal;
          if (savedGoal) {
            currentGoal = Number(savedGoal);
            setGoal(currentGoal);
          }
        }

        // 2. Считаем книги
        const currentYear = new Date().getFullYear();
        const readThisYear = (allBooks || []).filter(book => {
          if (book.status !== 'read' || !book.finish_date) return false;
          return String(book.finish_date).includes(currentYear.toString());
        });

        const readCount = readThisYear.length;
        setBooksReadThisYear(readCount);
        
        // 3. Генерируем раскладку полок
        generateLayout(currentGoal, readCount);

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveGoalToDb = async (newGoal) => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { reading_goal: newGoal } });
      if (error) throw error;
      generateLayout(newGoal, booksReadThisYear);
    } catch (error) {
      console.error('Ошибка сохранения цели:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGoalChange = (newValue) => {
    setGoal(newValue);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveGoalToDb(newValue), 300);
  };

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const isGoalAchieved = booksReadThisYear >= goal && goal > 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={LIME_ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 👇 ФОНОВЫЕ АУРЫ 👇 */}
      <View style={styles.auraPurple} />
      <View style={styles.auraLime} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Моя цель</Text>
        <View style={{ width: 28, alignItems: 'flex-end' }}>
          {saving && <ActivityIndicator size="small" color={LIME_ACCENT} />}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: 60 + insets.bottom } 
        ]} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Цель на год</Text>
        <Text style={styles.hint}>
          {saving ? 'Сохранение...' : 'Крутите барабан. Изменения сохраняются.'}
        </Text>

        {/* Барабан (Glassmorphism) */}
        <BlurView intensity={20} tint="dark" style={styles.pickerGlassContainer}>
          <View style={styles.pickerInner}>
            <WheelPicker
              data={goalOptions}
              value={goal}
              onValueChanged={({ item }) => handleGoalChange(item.value)}
              itemHeight={50}
              visibleItemCount={3}
              width={200}
              style={{ backgroundColor: 'transparent' }}
              itemTextStyle={styles.itemText}
              overlayItemStyle={styles.overlay}
            />
          </View>
        </BlurView>

        {/* Блок поздравления */}
        {isGoalAchieved && (
          <BlurView intensity={30} tint="dark" style={styles.congratsContainer}>
            <Text style={styles.congratsTitle}>ПОЗДРАВЛЯЮ! 🎉</Text>
            <Text style={styles.congratsSubtitle}>
              Ты выполнил свою цель! Похвали себя и продолжай читать 😄
            </Text>
          </BlurView>
        )}

        {/* Полки с книгами */}
        <View style={styles.shelvesContainer}>
          {bookLayout.shelves && bookLayout.shelves.map((shelfItems, shelfIndex) => (
            <View key={shelfIndex} style={styles.shelfWrapper}>
              <View style={styles.booksRow}>
                {shelfItems.map((item, index) => (
                  <SvgBook 
                    key={item.id} 
                    isRead={item.isRead} 
                    colorIndex={index} 
                    height={item.height} 
                    width={bookLayout.sizes.baseWidth * item.widthMultiplier} 
                    gap={item.gap} 
                  />
                ))}
              </View>
              {/* Полка в стиле неоновой линии */}
              <View style={styles.shelfBoard} />
            </View>
          ))}
        </View>

        {/* Счетчик */}
        <BlurView intensity={20} tint="dark" style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Прочитано <Text style={styles.progressHighlight}>{booksReadThisYear}</Text> книг за год
          </Text>
        </BlurView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, paddingHorizontal: 20, 
    zIndex: 2,
  },
  backButton: { padding: 5 },
  headerTitle: { 
    fontSize: 20, 
    fontFamily: 'PlusJakartaSans_600SemiBold', 
    color: TEXT_WHITE 
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 10,
    zIndex: 2,
  },
  title: { 
    fontSize: 34, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    color: TEXT_WHITE, 
    marginBottom: 4 
  },
  hint: { 
    fontSize: 14, 
    fontFamily: 'PlusJakartaSans_400Regular', 
    color: TEXT_MUTED, 
    marginBottom: 30, 
    textAlign: 'center' 
  },

  // 👇 ФОНОВЫЕ АУРЫ 👇
  auraPurple: {
    position: 'absolute',
    top: 0,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PURPLE_GLOW,
    opacity: 0.2,
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

  // Барабан (Стекло)
  pickerGlassContainer: {
    width: 250,
    height: 170,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  pickerInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  itemText: { 
    fontSize: 24, 
    fontFamily: 'PlusJakartaSans_600SemiBold', 
    color: TEXT_MUTED 
  },
  overlay: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: LIME_ACCENT,
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
  },

  // Поздравление
  congratsContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  congratsTitle: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: LIME_ACCENT,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(204, 255, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  congratsSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: TEXT_WHITE,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Полки
  shelvesContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  shelfWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    width: SCREEN_WIDTH - (SCREEN_PADDING * 2),
  },
  booksRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', 
    justifyContent: 'center',
    paddingHorizontal: SHELF_INNER_PADDING,
    width: '100%',
    height: SHELF_HEIGHT,
  },
  shelfBoard: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Тонкая стеклянная линия
    marginTop: 2,
    shadowColor: LIME_ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },

  // Счетчик (Стекло)
  progressContainer: {
    width: '90%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  progressText: { 
    fontSize: 16, 
    fontFamily: 'PlusJakartaSans_400Regular', 
    color: TEXT_MUTED 
  },
  progressHighlight: { 
    fontSize: 24, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    color: TEXT_WHITE 
  },
});