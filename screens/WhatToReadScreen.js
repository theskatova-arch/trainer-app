import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const LIME_ACCENT = '#B2D100'; 
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

function WhatToReadScreen({ navigation, route }) {
  const { allBooks = [] } = route.params || {};
  const [loading, setLoading] = useState(true);
  
  const [allGlobalBooks, setAllGlobalBooks] = useState([]);
  const [ratingsMap, setRatingsMap] = useState({});
  const [topRatedBooks, setTopRatedBooks] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: globalData, error: globalError } = await supabase
        .from('global_books')
        .select('*')
        .order('created_at', { ascending: false });

      if (globalError) throw globalError;

      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('title, rating')
        .gt('rating', 0); 

      if (booksError) throw booksError;

      const ratingStats = {};
      booksData.forEach(book => {
        if (!book.title || !book.rating) return;
        const key = book.title.toLowerCase().trim();
        if (!ratingStats[key]) ratingStats[key] = { sum: 0, count: 0 };
        ratingStats[key].sum += Number(book.rating);
        ratingStats[key].count += 1;
      });

      const averages = {};
      Object.keys(ratingStats).forEach(key => {
        averages[key] = (ratingStats[key].sum / ratingStats[key].count).toFixed(1);
      });

      setRatingsMap(averages);
      setAllGlobalBooks(globalData || []);

      const topRated = (globalData || []).filter(book => {
        const key = book.title.toLowerCase().trim();
        const rating = averages[key];
        return rating && parseFloat(rating) >= 4.5;
      });
      setTopRatedBooks(topRated);

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // 👇 Отрисовка карточки книги в слайдере 👇
  const renderSliderBook = ({ item }) => {
    const bookKey = item.title.toLowerCase().trim();
    const avgRating = ratingsMap[bookKey];
    const isAlreadyAdded = allBooks.some(userBook => userBook.title.toLowerCase().trim() === bookKey);

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        style={styles.sliderBookItem}
        onPress={() => console.log('Выбрана книга:', item.title)} 
      >
        <View style={styles.sliderCoverWrapper}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.sliderCover} resizeMode="cover" />
          ) : (
            <View style={styles.sliderCoverPlaceholder}>
              <Text style={styles.sliderCoverText}>{item.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          
          {isAlreadyAdded && (
            <View style={styles.addedFlag}>
              <Ionicons name="checkmark-circle" size={20} color="#6B46C1" />
            </View>
          )}
        </View>
        
        <Text style={styles.sliderBookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.sliderBookAuthor} numberOfLines={1}>{item.author}</Text>
        
        {avgRating ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={10} color={LIME_ACCENT} />
            <Text style={styles.ratingText}>{avgRating}</Text>
          </View>
        ) : (
          <View style={styles.noRatingRow}>
            <Ionicons name="star-outline" size={10} color={TEXT_MUTED} />
            <Text style={styles.noRatingText}>Нет оценок</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 👇 Кнопка "Смотреть все", которая идет в конце слайдера 👇
  const SliderFooter = ({ title, books }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={styles.sliderFooterButton}
      onPress={() => navigation.navigate('CategoryScreen', { 
        title: title, 
        books: books,
        ratingsMap: ratingsMap, // 👈 Передаем рейтинги
        allBooks: allBooks      // 👈 Передаем список книг пользователя (для галочек)
      })}
    >
      <Text style={styles.sliderFooterText}>Смотреть{'\n'}все книги</Text>
      <Ionicons name="chevron-forward" size={20} color={LIME_ACCENT} style={{ marginTop: 4 }} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={LIME_ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Что почитать?</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 👇 КАТЕГОРИЯ: ВЫСОКИЙ РЕЙТИНГ 👇 */}
        {topRatedBooks.length > 0 && (
          <View style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Книги с высоким рейтингом</Text>
            </View>

            <FlatList
              data={topRatedBooks.slice(0, 10)}
              renderItem={renderSliderBook}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sliderContent}
              // 👇 Передаем компонент кнопки в футер 👇
              ListFooterComponent={
                <SliderFooter 
                  title="Книги с высоким рейтингом" 
                  books={topRatedBooks} 
                />
              }
            />
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  auraPurple: {
    position: 'absolute',
    top: 100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PURPLE_GLOW,
    opacity: 0.15,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 70 : 50, 
    paddingBottom: 15, 
    zIndex: 2,
  },
  backButton: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE },

  categoryBlock: { marginBottom: 24 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: TEXT_WHITE,
  },
  sliderContent: {
    paddingHorizontal: 15,
  },

  sliderBookItem: {
    width: 100,
    marginHorizontal: 5,
  },
  sliderCoverWrapper: {
    width: '100%',
    shadowColor: LIME_ACCENT, 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 10, 
    elevation: 5,
    marginBottom: 8,
  },
  sliderCover: {
    width: '100%',
    aspectRatio: 0.707,
    borderRadius: 8,
  },
  sliderCoverPlaceholder: {
    width: '100%',
    aspectRatio: 0.707,
    backgroundColor: 'rgba(178, 209, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(178, 209, 0, 0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderCoverText: {
    color: LIME_ACCENT,
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  sliderBookTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: TEXT_WHITE,
    marginBottom: 2,
    minHeight: 32,
    lineHeight: 16,
  },
  sliderBookAuthor: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: TEXT_MUTED,
    marginBottom: 4,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(178, 209, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: LIME_ACCENT,
    marginLeft: 4,
  },
  noRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  noRatingText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: TEXT_MUTED,
    marginLeft: 4,
  },

  addedFlag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    borderRadius: 12,
    padding: 2,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.5)',
  },

  // 👇 Стили для кнопки "Смотреть все" 👇
  sliderFooterButton: {
    width: 90,
    height: '100%', 
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 90, // Немного поднимаем текст, чтобы он был по центру обложки
  },
  sliderFooterText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: LIME_ACCENT,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default WhatToReadScreen;