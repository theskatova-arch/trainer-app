import React, { useState, useEffect, useRef } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { searchBooksOnline } from '../services/bookService';
import WheelPicker from '@quidone/react-native-wheel-picker';

// Палитра 2027
const LIME_ACCENT = '#B2D100';
const PURPLE_GLOW = '#6B46C1';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';
const CARD_BG = 'rgba(255, 255, 255, 0.05)';
const GLASS_OVERLAY = 'rgba(9, 9, 11, 0.85)';

function BookListScreen({ 
  title, iconName, books = [], allBooks = [], setBooks, onMoveToReading, onMoveToRead,
  showDate, showDatePicker, onAddBook, deleteBook, navigation, onUpdateBook
}) {
  const [bookCover, setBookCover] = useState(null);
  const [isFromApi, setIsFromApi] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeout = useRef(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [filterYear, setFilterYear] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilterYear, setTempFilterYear] = useState('all');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [finishDate, setFinishDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showFinishPicker, setShowFinishPicker] = useState(false);

  const [randomBookModal, setRandomBookModal] = useState(false);
  const [randomBook, setRandomBook] = useState(null);
  const [showEmptyAlert, setShowEmptyAlert] = useState(false); 
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [finishingBook, setFinishingBook] = useState(null);
  const [finishRating, setFinishRating] = useState(0);
  const [finishReview, setFinishReview] = useState('');

  const closeAndResetModal = () => {
    setModalVisible(false);
    setBookTitle(''); setBookAuthor(''); setBookCover(null); setIsFromApi(false);
    setSearchResults([]); setStartDate(new Date()); setFinishDate(new Date());
    setShowDuplicateWarning(false);
  };

  // 👇 Функция для расчета расстояния Левенштейна (прощает опечатки) 👇
  const getLevenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // замена
            matrix[i][j - 1] + 1,     // вставка
            matrix[i - 1][j] + 1      // удаление
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

    useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (isFromApi) return;

    if (bookTitle.trim().length < 3) {
      setSearchResults([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);

    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchBooksOnline(bookTitle);

        // 👇 ОСТАВИЛИ ТОЛЬКО ОДНО ОБЪЯВЛЕНИЕ searchString 👇
        const normalizeString = (str) => str.toLowerCase().replace(/ё/g, 'е');
        const searchString = normalizeString(bookTitle.trim());

        const filteredResults = (results || []).filter(book => {
          const bookTitleClean = normalizeString(book.title);
          
          // Если есть прямое совпадение (подстрока)
          if (bookTitleClean.includes(searchString)) return true;

          // Если не совпало, проверяем на опечатки по словам
          const searchWords = searchString.split(' ').filter(w => w.length > 2);
          
          return searchWords.every(word => {
            const maxDistance = word.length <= 4 ? 1 : 2; 
            
            return bookTitleClean.split(' ').some(bookWord => {
              return getLevenshteinDistance(word, bookWord) <= maxDistance;
            });
          });
        });

        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Ошибка поиска:", error);
        setSearchResults([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [bookTitle, isFromApi]);

  const handleTitleChange = (text) => {
    setBookTitle(text);
    setIsFromApi(false);
    setShowDuplicateWarning(false);
  };

    const handleSelectBook = (item) => {
    Keyboard.dismiss();
    setIsFromApi(true);
    
    setBookTitle(item.title);
    setBookAuthor(item.author);
    setBookCover(item.cover);
    setSearchResults([]);

    // 👇 ТАКАЯ ЖЕ НОРМАЛИЗАЦИЯ ДЛЯ ПРОВЕРКИ НА ДУБЛИКАТ 👇
    const normalize = (str) => str.toLowerCase().replace(/ё/g, 'е').replace(/[«»"']/g, '').replace(/\s+/g, ' ').trim();
    
    const cleanSelected = normalize(item.title);
    
    const isAlreadyAdded = (allBooks || []).some(book => {
      const cleanBook = normalize(book.title);
      return cleanBook === cleanSelected || cleanBook.includes(cleanSelected) || cleanSelected.includes(cleanBook);
    });
    
    setShowDuplicateWarning(isAlreadyAdded);
  };

  const addBook = async () => {
    console.log('1️⃣ Функция addBook запущена');
    if (isAdding) return; 

    if (bookTitle.trim() === '' && bookAuthor.trim() === '') {
      Alert.alert('Ошибка', 'Введите название или автора');
      return;
    }

    setIsAdding(true); 

    const newBook = {
      title: bookTitle.trim() || 'Без названия',
      author: bookAuthor.trim() || 'Автор неизвестен',
      cover_url: bookCover,
      isFromApi: isFromApi,
    };

    if (showDatePicker) {
      newBook.start_date = startDate.toLocaleDateString('ru-RU');
      newBook.finish_date = finishDate.toLocaleDateString('ru-RU');
    }

    try {
      if (typeof onAddBook === 'function') {
        await onAddBook(newBook, getStatusFromProps());
      } else {
        const bookWithId = { ...newBook, id: Date.now().toString() };
        setBooks([...books, bookWithId]);
      }
      closeAndResetModal();
        } catch (error) {
      console.error("❌ Ошибка при добавлении:", error);
      // 👇 Показываем реальную ошибку на экране 👇
      Alert.alert('Ошибка базы данных', error.message);
    } finally {
      setIsAdding(false); 
    }
  };

  const getStatusFromProps = () => {
    if (title === 'Хочу прочитать') return 'want';
    if (title === 'Читаю') return 'reading';
    if (title === 'Прочитал') return 'read';
    return 'want';
  };

  const handleRandomBook = () => {
    if (!books || books.length === 0) {
      setShowEmptyAlert(true); 
      return;
    }
    if (books.length === 1) {
      setRandomBook(books[0]);
      setRandomBookModal(true);
      return;
    }
    let availableBooks = books;
    if (randomBook) {
      availableBooks = books.filter(b => b.id !== randomBook.id);
    }
    const randomIndex = Math.floor(Math.random() * availableBooks.length);
    setRandomBook(availableBooks[randomIndex]);
    setRandomBookModal(true);
  };

  const renderBook = ({ item }) => (
    <View style={styles.bookItem}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('BookDetail', { book: item, onUpdateBook: onUpdateBook })}
        activeOpacity={0.7}
        style={styles.coverWrapper}
      >
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverText}>{item.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteBook(item.id)}>
        <Ionicons name="trash-outline" size={16} color={LIME_ACCENT} />
      </TouchableOpacity>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
      </View>
     
      {onMoveToReading && (
        <TouchableOpacity style={styles.actionButton} onPress={() => onMoveToReading(item)}>
          <Text style={styles.actionButtonText}>Читать</Text>
        </TouchableOpacity>
      )}

      {onMoveToRead && (
        <TouchableOpacity 
          style={[styles.actionButton, styles.finishButton]} 
          onPress={() => {
            setFinishingBook(item);
            setFinishRating(0);
            setFinishReview('');
            setFinishModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Завершить</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getAvailableYears = () => {
    const yearCounts = {};
    books.forEach((book) => {
      if (!book.finish_date) return;
      const match = String(book.finish_date).match(/\d{4}/);
      if (match) {
        const year = parseInt(match[0], 10);
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    return Object.entries(yearCounts).map(([year, count]) => ({ year: parseInt(year), count })).sort((a, b) => b.year - a.year);
  };

    const filteredBooks = books.filter((book, index) => {
    if (title === 'Читаю' && index === 0) return false; 

    // Если фильтр не выбран, показываем всё
    if (filterYear === null) return true;
    
    // Если книга добавлена в "Прочитал", но у нее вдруг нет даты, 
    // при выбранном фильтре по году мы её скрываем.
    if (!book.finish_date) return false;
    
    const match = String(book.finish_date).match(/\d{4}/);
    if (match) return parseInt(match[0], 10) === Number(filterYear);
    return false;
  });

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={TEXT_WHITE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{title}</Text>

        <View style={styles.headerButtons}>
          {showDatePicker && (
            <TouchableOpacity onPress={() => { setTempFilterYear(filterYear || 'all'); setShowFilterModal(true); }} style={styles.iconBtn}>
              <Ionicons name="funnel-outline" size={24} color={TEXT_WHITE} />
            </TouchableOpacity>
          )}

          {title === 'Хочу прочитать' && (
            <TouchableOpacity onPress={handleRandomBook} style={styles.iconBtn}>
              <Ionicons name="dice-outline" size={32} color={TEXT_WHITE} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => { closeAndResetModal(); setModalVisible(true); }} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={BG_DARK} />
          </TouchableOpacity>
        </View>
      </View>

      {books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={60} color={CARD_BG} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyText}>Здесь пока пусто</Text>
          <Text style={styles.emptySubText}>Нажмите +, чтобы добавить книгу</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          
          {title === 'Читаю' && books.length > 0 && (
            <View style={styles.featuredBookWrapper}>
              <TouchableOpacity 
                style={styles.featuredBookCard}
                onPress={() => navigation.navigate('BookDetail', { book: books[0], onUpdateBook: onUpdateBook })}
                activeOpacity={0.8}
              >
                <BlurView intensity={20} tint="dark" style={styles.featuredGlass}>
                  <View style={styles.featuredContent}>
                    {books[0].cover_url ? (
                      <Image source={{ uri: books[0].cover_url }} style={styles.featuredCover} resizeMode="cover" />
                    ) : (
                      <View style={styles.featuredCoverPlaceholder}>
                        <Text style={styles.featuredCoverText}>{books[0].title.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.featuredInfo}>
                      <View style={styles.featuredLabelWrapper}>
                        <Text style={styles.featuredLabel}>СЕЙЧАС ЧИТАЮ</Text>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={3}>{books[0].title}</Text>
                      <Text style={styles.featuredAuthor} numberOfLines={2}>{books[0].author}</Text>
                    </View>
                  </View>
                  
                  {onMoveToRead && (
                    <TouchableOpacity 
                      style={styles.featuredFinishBtn} 
                      onPress={() => {
                        setFinishingBook(books[0]);
                        setFinishRating(0);
                        setFinishReview('');
                        setFinishModalVisible(true);
                      }}
                    >
                      <Text style={styles.featuredFinishBtnText}>ЗАВЕРШИТЬ ЧТЕНИЕ</Text>
                    </TouchableOpacity>
                  )}
                </BlurView>
              </TouchableOpacity>
            </View>
          )}

          {filteredBooks.length > 0 && (
            <FlatList
              key="three-columns" 
              data={filteredBooks}
              renderItem={renderBook}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              extraData={[filterYear, books]}
            />
          )}
        </View>
      )}

      {/* МОДАЛКА "СПИСОК ПУСТ" */}
      <Modal animationType="fade" transparent={true} visible={showEmptyAlert} onRequestClose={() => setShowEmptyAlert(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={[styles.modalGlass, { backgroundColor: GLASS_OVERLAY }]}>
            <Ionicons name="dice-outline" size={60} color={LIME_ACCENT} style={{ alignSelf: 'center', marginBottom: 20 }} />
            <Text style={styles.randomModalTitle}>Рандомайзер в замешательстве</Text>
            <Text style={{ color: TEXT_WHITE, textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 24, fontSize: 15 }}>
              Ему не из чего выбирать! Сначала добавь хотя бы одну книгу в список «Хочу прочитать».
            </Text>
            <TouchableOpacity style={styles.alertCloseBtn} onPress={() => setShowEmptyAlert(false)}>
              <Text style={styles.randomPrimaryBtnText}>Понятно</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* МОДАЛКА СЛУЧАЙНОЙ КНИГИ */}
      <Modal animationType="fade" transparent={true} visible={randomBookModal} onRequestClose={() => setRandomBookModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={[styles.modalGlass, { backgroundColor: GLASS_OVERLAY }]}>
            <Text style={styles.randomModalTitle}>Случайный выбор</Text>
            {randomBook && (
              <View style={styles.randomBookContent}>
                {randomBook.cover_url ? (
                  <Image source={{ uri: randomBook.cover_url }} style={styles.randomCoverImage} />
                ) : (
                  <View style={[styles.coverPlaceholder, { width: 120, height: 170, marginBottom: 20 }]}>
                    <Text style={[styles.coverText, { fontSize: 60 }]}>{randomBook.title.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.randomBookTitle} numberOfLines={3}>{randomBook.title}</Text>
                <Text style={styles.randomBookAuthor} numberOfLines={2}>{randomBook.author}</Text>
              </View>
            )}
            <View style={styles.randomButtonsRow}>
              <TouchableOpacity style={styles.randomSecondaryBtn} onPress={handleRandomBook}>
                <Text style={styles.randomSecondaryBtnText}>Еще</Text>
                <Ionicons name="dice-outline" size={16} color={LIME_ACCENT} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.randomPrimaryBtn} onPress={() => { setRandomBookModal(false); if (onMoveToReading) onMoveToReading(randomBook); }}>
                <Text style={styles.randomPrimaryBtnText}>Читать</Text>
                <Ionicons name="book-outline" size={16} color={BG_DARK} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.randomCancelBtn} onPress={() => setRandomBookModal(false)}>
              <Text style={styles.randomCancelBtnText}>Отмена</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

            {/* МОДАЛКА ОЦЕНКИ ПРИ ЗАВЕРШЕНИИ */}
      <Modal animationType="fade" transparent={true} visible={finishModalVisible} onRequestClose={() => setFinishModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={[styles.modalGlass, { backgroundColor: GLASS_OVERLAY }]}>
            <Text style={styles.randomModalTitle}>Поделитесь впечатлением</Text>
            
            {finishingBook && (
              <Text style={{ color: TEXT_WHITE, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 18, marginBottom: 20 }}>
                «{finishingBook.title}»
              </Text>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setFinishRating(star)}>
                  <Ionicons name={star <= finishRating ? 'star' : 'star-outline'} size={36} color={LIME_ACCENT} style={{ marginHorizontal: 4 }} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              multiline
              placeholder="Что вы думаете об этой книге?"
              placeholderTextColor={TEXT_MUTED}
              value={finishReview}
              onChangeText={setFinishReview}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              
              {/* 👇 Кнопка "Закрыть" (Сохраняет без оценки) 👇 */}
              <TouchableOpacity 
                style={[styles.cancelButton, { flex: 1, marginRight: 8 }]} 
                onPress={async () => {
                  setFinishModalVisible(false);
                  if (onUpdateBook && finishingBook) {
                    await onUpdateBook(finishingBook.id, {
                      status: 'read',
                      finish_date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
                      rating: null,
                      review: ''
                    });
                  }
                  if (onMoveToRead) onMoveToRead(finishingBook);
                }}
              >
                <Text style={styles.cancelButtonText}>Закрыть</Text>
              </TouchableOpacity>

              {/* 👇 Кнопка "Добавить" (Блокируется, если рейтинг 0) 👇 */}
              <TouchableOpacity 
                style={[styles.addButton, { flex: 1, marginLeft: 8 }, finishRating === 0 && { opacity: 0.5 }]} 
                disabled={finishRating === 0}
                onPress={async () => {
                  setFinishModalVisible(false);
                  if (onUpdateBook && finishingBook) {
                    await onUpdateBook(finishingBook.id, {
                      status: 'read',
                      finish_date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
                      rating: finishRating > 0 ? finishRating : null,
                      review: finishReview.trim() ? finishReview.trim() : null
                    });
                  }
                  if (onMoveToRead) onMoveToRead(finishingBook);
                }}
              >
                <Text style={styles.addButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* МОДАЛКА ФИЛЬТРА */}
      <Modal animationType="fade" transparent={true} visible={showFilterModal} onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={[styles.modalGlass, { backgroundColor: GLASS_OVERLAY }]}>
            <Text style={styles.modalTitle}>Фильтр по году</Text>
            <View style={styles.wheelContainer}>
              <View style={styles.wheelOverlay} pointerEvents="none" />
              <WheelPicker
                data={[{ label: 'Все книги', value: 'all' }, ...getAvailableYears().map(item => ({ label: `${item.year} (${item.count} кн.)`, value: item.year }))]}
                value={tempFilterYear} 
                onValueChanged={({ item }) => setTempFilterYear(item.value)}
                itemHeight={50}
                visibleItemCount={3}
                width={250}
                style={{ backgroundColor: 'transparent' }}
                itemTextStyle={styles.itemText}
                overlayItemStyle={styles.itemOverlay}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity style={[styles.cancelButton, { flex: 1, marginRight: 8 }]} onPress={() => { setFilterYear(null); setTempFilterYear('all'); setShowFilterModal(false); }}>
                <Text style={styles.cancelButtonText}>Сбросить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { flex: 1, marginLeft: 8 }]} onPress={() => { setFilterYear(tempFilterYear === 'all' ? null : tempFilterYear); setShowFilterModal(false); }}>
                <Text style={styles.addButtonText}>Применить</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* МОДАЛКА ДОБАВЛЕНИЯ */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeAndResetModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={80} tint="dark" style={[styles.modalGlass, { backgroundColor: GLASS_OVERLAY }]}>
              <Text style={styles.modalTitle}>Новая книга</Text>
              <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
                <TextInput
                  style={styles.input}
                  placeholder="Название книги"
                  placeholderTextColor={TEXT_MUTED}
                  value={bookTitle}
                  onChangeText={handleTitleChange}
                  autoCorrect={false}
                  blurOnSubmit={true}
                />
                {loadingSuggestions && <Text style={styles.loadingText}>Сканирование...</Text>}
                
                {searchResults.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <View>
                      {searchResults.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.searchItem} onPress={() => handleSelectBook(item)}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.searchItemTitle}>{item.title}</Text>
                            {item.isLocal && <Ionicons name="cloud-done-outline" size={16} color={LIME_ACCENT} />}
                          </View>
                          <Text style={styles.searchItemAuthor}>{item.author}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TextInput 
                  style={styles.input} 
                  placeholder="Автор" 
                  placeholderTextColor={TEXT_MUTED}
                  value={bookAuthor} 
                  onChangeText={setBookAuthor} 
                />

                {showDuplicateWarning && (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning-outline" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                    <Text style={styles.warningText}>
                      Эта книга уже есть в ваших списках!
                    </Text>
                  </View>
                )}

                {/* 👇 БЛОК ДАТ С ИСПОЛЬЗОВАНИЕМ ИМПЕРАТИВНОГО API ДЛЯ ANDROID 👇 */}
                {showDatePicker && (
                  <>
                    <TouchableOpacity 
                      style={styles.dateButton} 
                      onPress={() => {
                        if (Platform.OS === 'android') {
                          DateTimePickerAndroid.open({
                            value: startDate,
                            mode: 'date',
                            onChange: (event, selectedDate) => {
                              if (event.type === 'set' && selectedDate) {
                                setStartDate(selectedDate);
                              }
                            },
                          });
                        } else {
                          setShowStartPicker(true);
                        }
                      }}
                    >
                      <Text style={styles.dateButtonText}>📅 Начало: {startDate.toLocaleDateString('ru-RU')}</Text>
                    </TouchableOpacity>
                    
                    {Platform.OS === 'ios' && showStartPicker && (
                      <DateTimePicker 
                        value={startDate} 
                        mode="date" 
                        display="default" 
                        onChange={(event, selectedDate) => { 
                          setShowStartPicker(false); 
                          if (selectedDate) setStartDate(selectedDate); 
                        }} 
                      />
                    )}

                    <TouchableOpacity 
                      style={styles.dateButton} 
                      onPress={() => {
                        if (Platform.OS === 'android') {
                          DateTimePickerAndroid.open({
                            value: finishDate,
                            mode: 'date',
                            onChange: (event, selectedDate) => {
                              if (event.type === 'set' && selectedDate) {
                                setFinishDate(selectedDate);
                              }
                            },
                          });
                        } else {
                          setShowFinishPicker(true);
                        }
                      }}
                    >
                      <Text style={styles.dateButtonText}>✅ Конец: {finishDate.toLocaleDateString('ru-RU')}</Text>
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && showFinishPicker && (
                      <DateTimePicker 
                        value={finishDate} 
                        mode="date" 
                        display="default" 
                        onChange={(event, selectedDate) => { 
                          setShowFinishPicker(false); 
                          if (selectedDate) setFinishDate(selectedDate); 
                        }} 
                      />
                    )}
                  </>
                )}

                                  <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeAndResetModal} disabled={isAdding}>
                    <Text style={styles.cancelButtonText}>Отмена</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.addButton, 
                      (!bookTitle.trim() && !bookAuthor.trim()) && { opacity: 0.5 },
                      isAdding && { opacity: 0.7 }
                    ]} 
                    onPress={addBook}
                    disabled={isAdding || (!bookTitle.trim() && !bookAuthor.trim())}
                  >
                    {isAdding ? (
                      <ActivityIndicator color={BG_DARK} />
                    ) : (
                      <Text style={styles.addButtonText}>Добавить</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginRight: 16, padding: 4 },
  addBtn: { backgroundColor: LIME_ACCENT, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 15, paddingBottom: 120 },
  bookItem: { flex: 1, maxWidth: '30%', margin: 6, alignItems: 'center' },
  coverWrapper: { width: '100%', shadowColor: LIME_ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  coverPlaceholder: { width: '100%', aspectRatio: 0.707, backgroundColor: 'rgba(178, 209, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(178, 209, 0, 0.3)', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  coverText: { color: LIME_ACCENT, fontSize: 40, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  coverImage: { width: '100%', aspectRatio: 0.707, borderRadius: 8, marginBottom: 8 },
  deleteButton: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 4, zIndex: 10 },
  bookInfo: { alignItems: 'center', marginBottom: 8, width: '100%' },
  bookTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE, textAlign: 'center', marginBottom: 2, minHeight: 36, lineHeight: 18 },
  bookAuthor: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, textAlign: 'center' },
  actionButton: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 8, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 4 },
  actionButtonText: { color: TEXT_WHITE, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
  finishButton: { backgroundColor: 'rgba(178, 209, 0, 0.15)', borderWidth: 1, borderColor: LIME_ACCENT },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, marginBottom: 8 },
  emptySubText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED },
  featuredBookWrapper: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  featuredBookCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(178, 209, 0, 0.3)', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  featuredGlass: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 20 },
  featuredContent: { flexDirection: 'row', marginBottom: 20 },
  featuredCover: { width: 110, height: 160, borderRadius: 12, marginRight: 16 },
  featuredCoverPlaceholder: { width: 110, height: 160, borderRadius: 12, backgroundColor: 'rgba(178, 209, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(178, 209, 0, 0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  featuredCoverText: { color: LIME_ACCENT, fontSize: 50, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  featuredInfo: { flex: 1, justifyContent: 'center' },
  featuredLabelWrapper: { backgroundColor: 'rgba(178, 209, 0, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  featuredLabel: { color: LIME_ACCENT, fontSize: 10, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: 1 },
  featuredTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, marginBottom: 6, lineHeight: 26 },
  featuredAuthor: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED },
  featuredFinishBtn: { backgroundColor: LIME_ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  featuredFinishBtnText: { color: BG_DARK, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalGlass: { width: '90%', maxHeight: '85%', borderRadius: 24, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modalTitle: { fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, marginBottom: 20, textAlign: 'center' },
  randomModalTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: LIME_ACCENT, marginBottom: 20, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  randomBookContent: { alignItems: 'center', marginBottom: 24 },
  randomCoverImage: { width: 120, height: 170, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  randomBookTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: TEXT_WHITE, textAlign: 'center', marginBottom: 6 },
  randomBookAuthor: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, textAlign: 'center' },
  randomButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  randomSecondaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  randomSecondaryBtnText: { color: TEXT_WHITE, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  randomPrimaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: LIME_ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  randomPrimaryBtnText: { color: BG_DARK, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15 },
  randomCancelBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  randomCancelBtnText: { color: TEXT_WHITE, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, fontSize: 16, color: TEXT_WHITE, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 12 },
  loadingText: { color: LIME_ACCENT, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 10, textAlign: 'center' },
  dropdownContainer: { maxHeight: 180, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  searchItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  searchItemTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE },
  searchItemAuthor: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: TEXT_MUTED, marginTop: 2 },
  dateButton: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dateButtonText: { fontSize: 15, color: TEXT_WHITE, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  cancelButtonText: { color: TEXT_WHITE, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16 },
  addButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: LIME_ACCENT, marginLeft: 8 },
  addButtonText: { color: BG_DARK, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16 },
  alertCloseBtn: { backgroundColor: LIME_ACCENT, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%' },
  wheelContainer: { height: 150, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginVertical: 10 },
  wheelOverlay: { position: 'absolute', top: 50, left: 0, right: 0, height: 50, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LIME_ACCENT, backgroundColor: 'rgba(178, 209, 0, 0.05)', zIndex: 1 },
  itemText: { fontSize: 18, fontFamily: 'PlusJakartaSans_600SemiBold', color: TEXT_WHITE },
  itemOverlay: { borderColor: 'transparent' },
  warningContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 59, 48, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', padding: 12, borderRadius: 10, marginBottom: 16, marginTop: -4 },
  warningText: { color: '#FF3B30', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 },
});

export default BookListScreen;