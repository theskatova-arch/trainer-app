import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { supabase } from './lib/supabase';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TrackerScreen from './screens/TrackerScreen';
import { fetchBooks, addBook, updateBook, deleteBook } from './services/bookService';

const Stack = createNativeStackNavigator();

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wantBooks, setWantBooks] = useState([]);
  const [readingBooks, setReadingBooks] = useState([]);
  const [readBooks, setReadBooks] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadBooks();
    } else {
      setWantBooks([]);
      setReadingBooks([]);
      setReadBooks([]);
    }
  }, [user]);

  const loadBooks = async () => {
    try {
      const books = await fetchBooks();
      
      const wants = books.filter(b => b.status === 'want');
      const readings = books.filter(b => b.status === 'reading');
      const reads = books.filter(b => b.status === 'read');
      
      setWantBooks(wants);
      setReadingBooks(readings);
      setReadBooks(reads);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  };

  // ✅ Функция добавления книги
  const handleAddBook = async (bookData, status) => {
    try {
      console.log('📚 Добавляем книгу:', bookData, 'Статус:', status);
      
      const newBook = await addBook({
        ...bookData,
        status: status,
      });

      console.log('✅ Книга добавлена в БД:', newBook);

      // Обновляем локальные состояния
      if (status === 'want') {
        setWantBooks((prev) => [newBook, ...prev]);
      } else if (status === 'reading') {
        setReadingBooks((prev) => [newBook, ...prev]);
      } else if (status === 'read') {
        setReadBooks((prev) => [newBook, ...prev]);
      }

      return newBook;
    } catch (error) {
      console.error('❌ Ошибка добавления книги:', error);
      Alert.alert('Ошибка', 'Не удалось добавить книгу: ' + error.message);
      throw error;
    }
  };

  const moveToReading = async (book) => {
    try {
      const updatedBook = await updateBook(book.id, {
        status: 'reading',
        start_date: new Date().toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });

      setWantBooks((prev) => prev.filter((b) => b.id !== book.id));
      setReadingBooks((prev) => [updatedBook, ...prev]);
    } catch (error) {
      console.error('Error moving to reading:', error);
    }
  };

  const moveToRead = async (book) => {
    try {
      const updatedBook = await updateBook(book.id, {
        status: 'read',
        finish_date: new Date().toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });

      setReadingBooks((prev) => prev.filter((b) => b.id !== book.id));
      setReadBooks((prev) => [updatedBook, ...prev]);
    } catch (error) {
      console.error('Error moving to read:', error);
    }
  };

  const handleDeleteBook = async (id) => {
    try {
      await deleteBook(id);
      
      setWantBooks((prev) => prev.filter((b) => b.id !== id));
      setReadingBooks((prev) => prev.filter((b) => b.id !== id));
      setReadBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Tracker" 
              options={{ headerShown: false }}
            >
              {(props) => (
                <TrackerScreen
                  {...props}
                  wantBooks={wantBooks}
                  readingBooks={readingBooks}
                  readBooks={readBooks}
                  setWantBooks={setWantBooks}
                  setReadingBooks={setReadingBooks}
                  setReadBooks={setReadBooks}
                  moveToReading={moveToReading}
                  moveToRead={moveToRead}
                  onAddBook={handleAddBook}        // ✅ Передаём сюда
                  onDeleteBook={handleDeleteBook}  // ✅ Передаём сюда
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;