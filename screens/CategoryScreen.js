import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LIME_ACCENT = '#B2D100'; 
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

export default function CategoryScreen({ route, navigation }) {
  // Получаем заголовок, книги, рейтинги и список книг пользователя
  const { title, books, ratingsMap = {}, allBooks = [] } = route.params;

  const renderBook = ({ item }) => {
    const bookKey = item.title.toLowerCase().trim();
    const avgRating = ratingsMap[bookKey];
    const isAlreadyAdded = allBooks.some(userBook => userBook.title.toLowerCase().trim() === bookKey);

    return (
      <View style={styles.bookItem}>
        <View style={styles.coverWrapper}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverText}>{item.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          {/* 👇 Галочка (если книга уже в трекере) 👇 */}
          {isAlreadyAdded && (
            <View style={styles.addedFlag}>
              <Ionicons name="checkmark-circle" size={20} color="#6B46C1" />
            </View>
          )}
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
          
          {/* 👇 Плашка рейтинга 👇 */}
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
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  
  listContent: { paddingHorizontal: 15, paddingBottom: 40 },
  
  bookItem: { flex: 1, maxWidth: '30%', margin: 6, alignItems: 'center' },
  coverWrapper: { width: '100%', shadowColor: LIME_ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  coverPlaceholder: { width: '100%', aspectRatio: 0.707, backgroundColor: 'rgba(178, 209, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(178, 209, 0, 0.3)', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  coverText: { color: LIME_ACCENT, fontSize: 40, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  coverImage: { width: '100%', aspectRatio: 0.707, borderRadius: 8, marginBottom: 8 },
  
  bookInfo: { alignItems: 'center', marginBottom: 8, width: '100%' },
  bookTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE, textAlign: 'center', marginBottom: 2, minHeight: 36, lineHeight: 18 },
  bookAuthor: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, textAlign: 'center', marginBottom: 4 },

  // 👇 Плашки рейтинга (как в слайдере) 👇
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(178, 209, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
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
    marginTop: 4,
  },
  noRatingText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: TEXT_MUTED,
    marginLeft: 4,
  },

  // 👇 Галочка на обложке 👇
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
});