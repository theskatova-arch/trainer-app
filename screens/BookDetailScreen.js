import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchCommunityData } from '../services/bookService';

const { width } = Dimensions.get('window');

// Палитра 2027
const LIME_ACCENT = '#B2D100';
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

// 👇 ВЫНОСИМ КАРТОЧКУ ОТЗЫВА В ОТДЕЛЬНЫЙ КОМПОНЕНТ 👇
function ReviewCard({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = item.text.length > 100;

  return (
    <BlurView intensity={10} tint="dark" style={styles.communityReviewCard}>
      <View style={styles.communityReviewHeader}>
        <Text style={styles.communityReviewUser}>@{item.username}</Text>
        <View style={styles.communityReviewStars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons 
              key={s} 
              name={s <= item.rating ? 'star' : 'star-outline'} 
              size={12} 
              color={LIME_ACCENT} 
              style={{ marginLeft: 2 }}
            />
          ))}
        </View>
      </View>
      
      <Text style={styles.communityReviewText} numberOfLines={isExpanded ? undefined : 3}>
        {item.text}
      </Text>
      
      {isLongText && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginTop: 8 }}>
          <Text style={styles.expandButton}>
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </Text>
        </TouchableOpacity>
      )}
    </BlurView>
  );
}

export default function BookDetailScreen({ route, navigation }) {
  const { book, onUpdateBook, isReadOnly = false } = route.params;

  const [review, setReview] = useState(book.review || '');
  const [rating, setRating] = useState(book.rating || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 👇 Состояния для дат 👇
  const [startDate, setStartDate] = useState(book.start_date || null);
  const [finishDate, setFinishDate] = useState(book.finish_date || null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showFinishPicker, setShowFinishPicker] = useState(false);

  const [communityData, setCommunityData] = useState({ average: 0, count: 0, reviews: [] });
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  const loadCommunity = async () => {
    setLoadingCommunity(true);
    const data = await fetchCommunityData(book.title, book.author);
    setCommunityData(data);
    setLoadingCommunity(false);
  };

  useEffect(() => {
    loadCommunity();
  }, [book.title, book.author]);

  // Функция конвертации строки в Date (для календаря)
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    // Пытаемся распарсить строку формата "1 января 2024 г."
    const months = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
      'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };
    const parts = dateStr.replace(' г.', '').split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = months[parts[1].toLowerCase()];
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return new Date(dateStr);
  };

  const saveChanges = async () => {
    if (isReadOnly) return; 

    setIsSaving(true);
    try {
      const updates = {
        rating: rating === 0 ? null : Number(rating), 
        review: review.trim(),
        start_date: startDate,
        finish_date: finishDate
      };

      if (onUpdateBook) {
        await onUpdateBook(book.id, updates); 
      } else {
        throw new Error("Функция обновления не передана");
      }

      await loadCommunity();
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);

    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось сохранить данные: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => !isReadOnly && setRating(star)}
            activeOpacity={isReadOnly ? 1 : 0.7}
          >
            <Ionicons 
              name={star <= rating ? 'star' : 'star-outline'} 
              size={32} 
              color={LIME_ACCENT} 
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />

      <ScrollView 
        style={{ flex: 1, zIndex: 2 }} 
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Хедер */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={TEXT_WHITE} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
          </View>
        </View>

        {/* Блок "Мои мысли" */}
        <BlurView intensity={20} tint="dark" style={styles.block}>
          <Text style={styles.blockTitle}>Мои мысли</Text>
          
          {/* 👇 РЕДАКТИРУЕМАЯ ДАТА НАЧАЛА 👇 */}
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => !isReadOnly && setShowStartPicker(true)}
            disabled={isReadOnly}
          >
            <Text style={styles.label}>Начало:</Text>
            <View style={styles.dateValueWrapper}>
              <Text style={styles.value}>{startDate || 'Не начата'}</Text>
              {!isReadOnly && <Ionicons name="calendar-outline" size={16} color={LIME_ACCENT} style={{ marginLeft: 8 }} />}
            </View>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker 
              value={parseDateString(startDate)} 
              mode="date" 
              display="default" 
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
                }
              }} 
            />
          )}
          
          {/* 👇 РЕДАКТИРУЕМАЯ ДАТА ОКОНЧАНИЯ 👇 */}
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => !isReadOnly && setShowFinishPicker(true)}
            disabled={isReadOnly}
          >
            <Text style={styles.label}>Окончание:</Text>
            <View style={styles.dateValueWrapper}>
              <Text style={styles.value}>{finishDate || 'Не завершена'}</Text>
              {!isReadOnly && <Ionicons name="calendar-outline" size={16} color={LIME_ACCENT} style={{ marginLeft: 8 }} />}
            </View>
          </TouchableOpacity>
          {showFinishPicker && (
            <DateTimePicker 
              value={parseDateString(finishDate)} 
              mode="date" 
              display="default" 
              onChange={(event, selectedDate) => {
                setShowFinishPicker(false);
                if (selectedDate) {
                  setFinishDate(selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
                }
              }} 
            />
          )}

          <View style={styles.ratingSection}>
            <Text style={styles.label}>Моя оценка:</Text>
            {renderStars()}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Отзыв:</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                isReadOnly && { backgroundColor: 'transparent', color: TEXT_MUTED }
              ]}
              multiline
              placeholder="Поделитесь мыслями о книге..."
              placeholderTextColor={TEXT_MUTED}
              value={review}
              onChangeText={setReview}
              editable={!isReadOnly}
            />
          </View>

          {!isReadOnly && (
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                isSaving && { opacity: 0.7 },
                isSaved && { backgroundColor: 'rgba(178, 209, 0, 0.2)' } 
              ]} 
              onPress={saveChanges}
              disabled={isSaving || isSaved}
            >
              {isSaving ? (
                <ActivityIndicator color={BG_DARK} />
              ) : isSaved ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={20} color={LIME_ACCENT} style={{ marginRight: 8 }} />
                  <Text style={[styles.saveButtonText, { color: LIME_ACCENT }]}>Сохранено</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          )}
        </BlurView>

        {/* Блок "Комьюнити" */}
        <BlurView intensity={20} tint="dark" style={styles.block}>
          <Text style={styles.blockTitle}>Комьюнити</Text>
          
          {loadingCommunity ? (
            <ActivityIndicator color={LIME_ACCENT} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.communityRatingContainer}>
                <Text style={styles.communityAverage}>{communityData.average || '0.0'}</Text>
                <View style={styles.communityStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star} 
                      name={star <= Math.round(communityData.average) ? 'star' : 'star-outline'} 
                      size={16} 
                      color={LIME_ACCENT} 
                    />
                  ))}
                </View>
                <Text style={styles.communityCount}>
                  ({communityData.count} {communityData.count === 1 ? 'оценка' : communityData.count > 1 && communityData.count < 5 ? 'оценки' : 'оценок'})
                </Text>
              </View>

              {communityData.reviews && communityData.reviews.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Отзывы:</Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={width * 0.75 + 12} 
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingVertical: 10, alignItems: 'flex-start' }}
                  >
                    {communityData.reviews.map((item, index) => (
                      <ReviewCard key={index} item={item} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {(!communityData.reviews || communityData.reviews.length === 0) && (
                <Text style={styles.communityPlaceholder}>Пока нет отзывов от других пользователей.</Text>
              )}
            </>
          )}
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
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 70 : 50, 
    paddingBottom: 20, 
    alignItems: 'center' 
  },
  backButton: { marginRight: 15 },
  headerInfo: { flex: 1 },
  title: { fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, marginBottom: 4 },
  author: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED },

  block: { 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 20, 
    borderRadius: 24, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  blockTitle: { 
    fontSize: 20, 
    fontFamily: 'PlusJakartaSans_800ExtraBold', 
    color: LIME_ACCENT, 
    marginBottom: 16,
    textShadowColor: 'rgba(178, 209, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16, 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  label: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE },
  value: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED },
  dateValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  ratingSection: { marginTop: 10, marginBottom: 20 },
  starsContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  starIcon: { marginRight: 8 },
  
  inputGroup: { marginBottom: 20, marginTop: 10 },
  input: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 15, 
    marginTop: 8, 
    color: TEXT_WHITE,
    fontFamily: 'PlusJakartaSans_400Regular'
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  
  saveButton: { 
    backgroundColor: LIME_ACCENT, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  saveButtonText: { color: BG_DARK, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16 },

  communityRatingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  communityAverage: { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, marginRight: 12 },
  communityStars: { flexDirection: 'row', marginRight: 8 },
  communityCount: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED },
  communityPlaceholder: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, fontStyle: 'italic', marginTop: 8 },

  communityReviewCard: {
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    width: width * 0.75, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  communityReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  communityReviewUser: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: LIME_ACCENT,
    fontSize: 14,
  },
  communityReviewStars: {
    flexDirection: 'row',
  },
  communityReviewText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: TEXT_WHITE,
    lineHeight: 20,
  },
  expandButton: {
    color: LIME_ACCENT,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  }
});