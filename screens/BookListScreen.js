import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

function BookListScreen({ 
    title, 
    iconName, 
    books = [], 
    setBooks, 
    onMoveToReading, 
    onMoveToRead,
    showDate,
    showDatePicker,
    }) {

  // Состояние для списка книг
  //const [books, setBooks] = useState([]);
   // Состояние для фильтра 
  const [filterYear, setFilterYear] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  // Состояние для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  // Состояния для полей ввода
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
 // Состояния для для даты
    const [startDate, setStartDate] = useState(new Date());
    const [finishDate, setFinishDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showFinishPicker, setShowFinishPicker] = useState(false);

 // Функция добавления книги
    const addBook = () => {
  // Проверяем, что хотя бы одно поле заполнено
  if (bookTitle.trim() === '' && bookAuthor.trim() === '') {
    Alert.alert('Ошибка', 'Введите название или автора');
    return;
  }

  // Создаём объект новой книги
  const newBook = {
    id: Date.now().toString(),
    title: bookTitle.trim() || 'Без названия',
    author: bookAuthor.trim() || 'Автор неизвестен',
};
    if (showDatePicker) {
    newBook.startDate = startDate.toLocaleDateString('ru-RU');
    newBook.finishDate = finishDate.toLocaleDateString('ru-RU');
  }

  // Проверяем, что setBooks — функция, и только тогда вызываем
  if (typeof setBooks === 'function') {
    setBooks([...books, newBook]);
  } else {
    console.warn('setBooks не является функцией!');
    // Если setBooks не функция — показываем Alert
    Alert.alert('Ошибка', 'Не удалось добавить книгу. Попробуйте перезапустить приложение.');
    return;
  }

  // Очищаем поля и закрываем модалку
  setBookTitle('');
  setBookAuthor('');
  setModalVisible(false);
};

  // Функция удаления книги
  const deleteBook = (id) => {
  Alert.alert('Удалить книгу?', 'Вы уверены?', [
    { text: 'Отмена', style: 'cancel' },
    {
      text: 'Удалить',
      onPress: () => {
        if (typeof setBooks === 'function') {
          setBooks(books.filter((book) => book.id !== id));
        } else {
          console.warn('setBooks не является функцией!');
        }
      },
      style: 'destructive',
    },
  ]);
};

  // Рендерим одну книгу в списке
  const renderBook = ({ item }) => (
    <View style={styles.bookItem}>
         {/* Корзина */}
      <TouchableOpacity 
      style={styles.deleteButton}
      onPress={() => deleteBook(item.id)}>
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
        {/* Обложка */}
        <View style={styles.coverPlaceholder}>
            <Text style={styles.coverText}>
            {item.title.charAt(0).toUpperCase()}</Text>
        </View>
     {/* Инфо о книге */}
      <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
         {/* Показываем дату начала, если она есть */}
            {item.startDate && (
            <Text style={styles.startDate}>
                Начал(а): {item.startDate}
            </Text>
            )}
            {/* Показываем дату окончания, если она есть */}
            {item.finishDate && (
            <Text style={styles.finishDate}>
                Завершил(а): {item.finishDate}
            </Text>
            )}
      </View>
     
     {/* Кнопка Читать */}
     {onMoveToReading && (
        <TouchableOpacity
         style={styles.actionButton}
         onPress={() => onMoveToReading(item)}
            >
            <Text style={styles.actionButtonText}>Читать</Text>
        </TouchableOpacity>
        )}

        {/* Кнопка "Завершить" (только для списка "Читаю") */}
        {onMoveToRead && (
        <TouchableOpacity
            style={[styles.actionButton, styles.finishButton]}
            onPress={() => onMoveToRead(item)}
         >
            <Text style={styles.actionButtonText}>Завершить</Text>
        </TouchableOpacity>
        )}
  </View>
  );

    // Получаем список уникальных годов из завершённых книг
    const getAvailableYears = () => {
  // Сначала получаем все года из книг
  const yearCounts = {};
  
  books.forEach((book) => {
    if (!book.finishDate) return;
    
    // Парсим год из finishDate
    let year;
    if (book.finishDate.includes('-')) {
      year = new Date(book.finishDate).getFullYear();
    } else if (book.finishDate.includes('.')) {
      const parts = book.finishDate.split('.');
      year = parseInt(parts[2], 10);
    } else {
      year = new Date(book.finishDate).getFullYear();
    }
    
    if (!isNaN(year)) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });
  
  // Превращаем объект в массив и сортируем по убыванию
  return Object.entries(yearCounts)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => b.year - a.year);
};

  return (
    <View style={styles.container}>
      {/* Заголовок экрана */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Ionicons name={iconName} size={24} color="#007AFF" /> {title}
        </Text>

        <View style={styles.headerButtons}>
            {/* Кнопка фильтра (только для "Прочитал") */}
            {showDatePicker && (
            <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
                <Ionicons name="funnel-outline" size={28} color="#007AFF" />
            </TouchableOpacity>
            )}

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={44} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>

      {/* Список книг */}
      {books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Здесь пока пусто</Text>
          <Text style={styles.emptySubText}>Нажмите +, чтобы добавить книгу</Text>
        </View>
      ) : (
        <FlatList
            key="three-columns" 
                data={books.filter((book) => {
  if (!filterYear) return true; // Если фильтр не выбран — показываем всё
  if (!book.finishDate) return false; // Если нет даты — пропускаем
  
  // Парсим год из finishDate вручную
  let year;
  if (book.finishDate.includes('-')) {
    // Формат YYYY-MM-DD
    year = new Date(book.finishDate).getFullYear();
  } else if (book.finishDate.includes('.')) {
    // Формат DD.MM.YYYY
    const parts = book.finishDate.split('.');
    year = parseInt(parts[2], 10);
  } else {
    // Другой формат — пробуем new Date()
    year = new Date(book.finishDate).getFullYear();
  }
  
  return year === filterYear;
})}
          renderItem={renderBook}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Модальное окно фильтра */}
<Modal
  animationType="slide"
  transparent={true}
  visible={showFilterModal}
  onRequestClose={() => setShowFilterModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalView}>
      <Text style={styles.modalTitle}>Фильтр по году</Text>
      
      {/* Кнопка "Все годы" */}
      <TouchableOpacity
        style={[styles.filterOption, filterYear === null && styles.filterOptionActive]}
        onPress={() => {
          setFilterYear(null);
          setShowFilterModal(false);
        }}
      >
        <Text style={[styles.filterOptionText, filterYear === null && styles.filterOptionTextActive]}>
          Все годы ({books.filter((b) => b.finishDate).length} книг)
        </Text>
      </TouchableOpacity>

      {/* Барабан с годами */}
      {getAvailableYears().length > 0 ? (
        <View style={styles.pickerContainer}>
          <Picker
                selectedValue={filterYear}
                onValueChange={(itemValue) => {
                    setFilterYear(itemValue);
                    setShowFilterModal(false);
                }}
                style={styles.picker}
                mode="dialog"  // <-- Добавь эту строку (для Android)
                dropdownIconColor="#007AFF"  // <-- Цвет стрелки (для Android)
                >
                {getAvailableYears().map((yearData) => (
                    <Picker.Item
                    key={yearData.year}
                    label={`${yearData.year} (${yearData.count} книг)`}
                    value={yearData.year}
                    />
                ))}
</Picker>
        </View>
      ) : (
        <Text style={styles.emptyFilterText}>Нет завершённых книг</Text>
      )}

      {/* Кнопка закрытия */}
      <TouchableOpacity
        style={[styles.modalButton, styles.cancelButton, { marginTop: 10 }]}
        onPress={() => setShowFilterModal(false)}
      >
        <Text style={styles.cancelButtonText}>Закрыть</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {/* Модальное окно для добавления книги */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Добавить книгу</Text>

            <TextInput
              style={styles.input}
              placeholder="Название книги"
              value={bookTitle}
              onChangeText={setBookTitle}
              autoFocus
            />

            <TextInput
              style={styles.input}
              placeholder="Автор"
              value={bookAuthor}
              onChangeText={setBookAuthor}
            />
                {/* Выбор даты начала */}
            {showDatePicker && (
            <>
                <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
                >
                <Text style={styles.dateButtonText}>
                    📅 Дата начала: {startDate.toLocaleDateString('ru-RU')}
                </Text>
                </TouchableOpacity>

                {showStartPicker && (
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

            {/* Выбор даты окончания */}
            <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowFinishPicker(true)}
            >
            <Text style={styles.dateButtonText}>
                ✅ Дата окончания: {finishDate.toLocaleDateString('ru-RU')}
            </Text>
            </TouchableOpacity>

            {showFinishPicker && (
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
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addBook}
              >
                <Text style={styles.addButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 8,
  },
  
  coverPlaceholder: {
    width: '100%',
    aspectRatio: 0.707,
    height: 170,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  coverText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
},
    bookInfo: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  paddingHorizontal: 4,
    },

  bookItem: {
        flex: 1,
        maxWidth: '30%',       // Ширина карточки
        backgroundColor: 'transparent',
        margin: 6,
        alignItems: 'center',  // Центрируем дочерние элементы
        padding: 0,   
    },

  bookTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
  },

  bookAuthor: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center'
  },

    startDate: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
        fontStyle: 'italic',
        textAlign: 'center',
    },

    actionButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 0,
        borderRadius: 6,
        width: '100%',
        alignItems: 'center'
    },

    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    finishButton: {
        backgroundColor: '#34C759',  // Зелёный цвет
    },  
    finishDate: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    dateButton: {
        backgroundColor: '#F2F2F7',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#007AFF',
        textAlign: 'center',
},
    deleteButton: {
    position: 'absolute', // Абсолютное позиционирование
    top: 8,               // Отступ сверху
    right: 8,             // Отступ справа
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Полупрозрачный фон для кнопки
    borderRadius: 20,
    padding: 4,
    zIndex: 1,     
    },       // Поверх обложки
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#AEAEB2',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerButtons: {
  flexDirection: 'row',
  alignItems: 'center',
},
filterButton: {
  marginRight: 16,
  padding: 4,
},
filterOption: {
  padding: 14,
  borderRadius: 10,
  marginBottom: 8,
  backgroundColor: '#F2F2F7',
},
filterOptionActive: {
  backgroundColor: '#007AFF',
},
filterOptionText: {
  fontSize: 16,
  color: '#000',
  textAlign: 'center',
},
filterOptionTextActive: {
  color: '#fff',
  fontWeight: '600',
},
emptyFilterText: {
  fontSize: 16,
  color: '#8E8E93',
  textAlign: 'center',
  marginVertical: 20,
},

});

export default BookListScreen;