import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { fetchActivityFeed } from '../services/bookService';

// Палитра 2027
const LIME_ACCENT = '#B2D100';
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

function CommunityScreen({ navigation }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    const data = await fetchActivityFeed();
    setFeed(data);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const toggleExpand = (id) => {
    setExpandedReviews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 👇 ФУНКЦИЯ ФОРМАТИРОВАНИЯ ВРЕМЕНИ 👇
  const formatTime = (dateString) => {
    if (!dateString) return 'Недавно';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Проверка на "Сегодня"
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Сегодня, ${time}`;
    }
    
    // Проверка на "Вчера"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();
                        
    if (isYesterday) {
      return `Вчера, ${time}`;
    }
    
    // Для более старых дат
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${time}`;
  };

  const renderItem = ({ item }) => {
    let actionText = '';
    let isGoalEvent = item.action_type === 'goal_completed';

    if (item.action_type === 'finished') {
      actionText = 'закончил(а) читать книгу';
    } else if (item.action_type === 'reviewed') {
      actionText = 'оставил(а) отзыв на книгу';
    } else if (item.action_type === 'rated') {
      actionText = 'поставил(а) оценку книге';
    } else if (isGoalEvent) {
      actionText = item.book_title; 
    }

    const isExpanded = expandedReviews[item.id];
    const reviewText = item.review_text || '';
    const shouldTruncate = reviewText.length > 100;
    
    // 👇 Защита от пустого никнейма 👇
    const safeUsername = item.username || 'Пользователь';
    
    // 👇 Получаем отформатированное время 👇
    const displayTime = formatTime(item.created_at);

    // 👇 ОСОБАЯ КАРТОЧКА ДЛЯ ЦЕЛИ 👇
    if (isGoalEvent) {
      return (
        <BlurView intensity={30} tint="dark" style={[styles.card, styles.goalCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, styles.goalAvatar]}>
              <Text style={styles.avatarTextGoal}>{safeUsername.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.headerText}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('UserProfile', { 
                  userId: item.user_id, 
                  username: safeUsername 
                })}
              >
                <Text style={styles.username}>@{safeUsername}</Text>
              </TouchableOpacity>
              <Text style={styles.timeText}>{displayTime}</Text>
            </View>
          </View>
          
          <Text style={styles.goalTitle}>ПОЗДРАВЛЯЕМ! 🎉</Text>
          <Text style={styles.goalDescription}>
            @{safeUsername} {actionText}
          </Text>
        </BlurView>
      );
    }

    // 👇 ОБЫЧНАЯ КАРТОЧКА 👇
    return (
      <BlurView intensity={15} tint="dark" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{safeUsername.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('UserProfile', { 
                userId: item.user_id, 
                username: safeUsername 
              })}
            >
              <Text style={styles.username}>@{safeUsername}</Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>{displayTime}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.actionText}>
            {actionText}{' '}
            <TouchableOpacity 
              onPress={() => navigation.navigate('BookDetail', { 
                book: { 
                  id: item.book_id, 
                  title: item.book_title, 
                  rating: item.rating, 
                  review: item.review_text,
                  author: item.book_author || 'Автор неизвестен'
                },
                isReadOnly: true
              })}
            >
              <Text style={styles.bookTitle}>«{item.book_title}»</Text>
            </TouchableOpacity>
          </Text>
        </View>

        {item.action_type === 'rated' && item.rating && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star} 
                name={star <= item.rating ? 'star' : 'star-outline'} 
                size={16} 
                color={LIME_ACCENT} 
                style={{ marginRight: 4 }}
              />
            ))}
          </View>
        )}

        {item.action_type === 'reviewed' && reviewText ? (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewText} numberOfLines={isExpanded ? undefined : 3}>
              {reviewText}
            </Text>
            {shouldTruncate && (
              <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                <Text style={styles.expandButton}>
                  {isExpanded ? 'Свернуть' : 'Развернуть'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </BlurView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Ауры на фоне */}
      <View style={styles.auraPurple} />
      <View style={styles.auraLime} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Комьюнити</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={LIME_ACCENT} />
        </View>
      ) : (
        <FlatList
          data={feed}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIME_ACCENT} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="planet-outline" size={60} color="rgba(255,255,255,0.1)" style={{ marginBottom: 20 }} />
              <Text style={styles.emptyText}>Пока нет событий</Text>
              <Text style={styles.emptySubText}>Добавьте книгу и поставьте оценку, чтобы появилась запись!</Text>
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
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: PURPLE_GLOW,
    opacity: 0.2,
  },
  auraLime: {
    position: 'absolute',
    bottom: 100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: LIME_ACCENT,
    opacity: 0.1,
  },

  topBar: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    zIndex: 2,
  },
  backButton: { padding: 5 },
  pageTitle: { 
    fontSize: 22, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    color: TEXT_WHITE 
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  
  // Карточки (Glass)
  card: { 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  
  // Аватарки
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  avatarText: { color: TEXT_WHITE, fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  
  goalAvatar: { backgroundColor: LIME_ACCENT },
  avatarTextGoal: { color: BG_DARK, fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold' },

  headerText: { flex: 1 },
  username: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE },
  timeText: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, marginTop: 2 },

  actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  actionText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_WHITE, flexShrink: 1, lineHeight: 20 },
  bookTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', color: LIME_ACCENT},

  ratingRow: { flexDirection: 'row', marginTop: 20, marginBottom: 5 },
  
  reviewBox: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    padding: 12, 
    borderRadius: 12, 
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  reviewText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_WHITE, lineHeight: 20 },
  expandButton: { color: LIME_ACCENT, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 8, fontSize: 13 },

  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyText: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, marginBottom: 8 },
  emptySubText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, textAlign: 'center' },

  // Карточка цели (Неоновая)
  goalCard: {
    borderColor: 'rgba(178, 209, 0, 0.4)',
    shadowColor: LIME_ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  goalTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: LIME_ACCENT,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(178, 209, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  goalDescription: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: TEXT_WHITE,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CommunityScreen;