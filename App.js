import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Alert } from 'react-native';
import { supabase } from './lib/supabase';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TrackerScreen from './screens/TrackerScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import CommunityScreen from './screens/CommunityScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import MyGoalScreen from './screens/MyGoalScreen';
import SettingsScreen from './screens/SettingsScreen';

import { useFonts } from 'expo-font';
import { PlayfairDisplay_700Bold, PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { Lora_400Regular, Lora_500Medium } from '@expo-google-fonts/lora';
import { Orbitron_700Bold, Orbitron_900Black } from '@expo-google-fonts/orbitron';
import { SpaceGrotesk_400Regular, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';

import { 
  fetchBooks, 
  addBook, 
  updateBook, 
  deleteBook, 
  saveToGlobalBooks, 
  logActivity,
  checkGoalCompletionLogged
} from './services/bookService';

import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';

const Stack = createNativeStackNavigator();

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wantBooks, setWantBooks] = useState([]);
  const [readingBooks, setReadingBooks] = useState([]);
  const [readBooks, setReadBooks] = useState([]);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular,
    Lora_400Regular,
    Lora_500Medium,
    Orbitron_700Bold,
    Orbitron_900Black,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_800ExtraBold,
  });

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
      setWantBooks(books.filter(b => b.status === 'want'));
      setReadingBooks(books.filter(b => b.status === 'reading'));
      setReadBooks(books.filter(b => b.status === 'read'));
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  };

  const checkAndLogGoal = async (currentReadBooks) => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) return;

      const goal = Number(data.user.user_metadata?.reading_goal) || 0;
      if (goal === 0) return;

      const currentYear = new Date().getFullYear();
      const readThisYear = currentReadBooks.filter(book => {
        if (!book.finish_date) return false;
        return book.finish_date.includes(currentYear.toString());
      });

      if (readThisYear.length >= goal) {
        const alreadyLogged = await checkGoalCompletionLogged(goal);
        
        if (!alreadyLogged) {
          await logActivity('goal_completed', null, {
            custom_title: `выполнил(а) свою цель — ${goal} книг за год`,
            custom_text: `Поздравляем! 🎉`
          });
        }
      }
    } catch (error) {
      console.error('Ошибка проверки цели:', error);
    }
  };

  const handleUpdateBook = async (id, updates) => {
    try {
      const currentBook = readBooks.find(b => b.id === id) 
                       || readingBooks.find(b => b.id === id) 
                       || wantBooks.find(b => b.id === id);

      const updated = await updateBook(id, updates);
      
      setWantBooks(prev => prev.map(b => b.id === id ? updated : b));
      setReadingBooks(prev => prev.map(b => b.id === id ? updated : b));
      
      const updatedReadBooks = readBooks.map(b => b.id === id ? updated : b);
      setReadBooks(updatedReadBooks);

            // 👇 ЛОГИКА ДЛЯ ЛЕНТЫ 👇
      if (updates.status === 'read' && currentBook?.status !== 'read') {
        
        // 👇 Определяем тип события: отзыв, оценка или просто завершение 👇
        let actionType = 'finished'; // По умолчанию
        
        if (updates.rating && updates.review) {
          actionType = 'reviewed_and_rated';
        } else if (updates.rating) {
          actionType = 'rated';
        } else if (updates.review) {
          actionType = 'reviewed';
        }
        
        await logActivity(actionType, updated, { 
          rating: updates.rating || null,
          review_text: updates.review || null
        });

        await checkAndLogGoal(updatedReadBooks);
            } else {
        // 👇 ОБЪЕДИНЯЕМ ОЦЕНКУ И ОТЗЫВ ДЛЯ КАРТОЧКИ КНИГИ 👇
        const ratingChanged = updates.rating !== undefined && currentBook && currentBook.rating !== updates.rating;
        const reviewChanged = updates.review !== undefined && updates.review && currentBook && currentBook.review !== updates.review.trim();

        if (ratingChanged || reviewChanged) {
          // Берем новые данные, если они изменились, иначе — старые
          const finalRating = ratingChanged ? updates.rating : currentBook?.rating;
          const finalReview = reviewChanged ? updates.review : currentBook?.review;

          // Определяем тип события
          let actionType = 'finished';
          if (finalRating && finalReview) actionType = 'reviewed_and_rated';
          else if (finalRating) actionType = 'rated';
          else if (finalReview) actionType = 'reviewed';

          await logActivity(actionType, updated, { 
            rating: finalRating || null,
            review_text: finalReview || null
          });
        }
      }
      
      return updated;
    } catch (error) {
      console.error('Ошибка обновления книги:', error);
      throw error;
    }
  };

  const handleAddBook = async (bookData, status) => {
    try {
      const dataToSave = { ...bookData, status };

      if (status === 'read' && !dataToSave.finish_date) {
        dataToSave.finish_date = new Date().toLocaleDateString('ru-RU', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
      }

      if (status === 'reading' && !dataToSave.start_date) {
        dataToSave.start_date = new Date().toLocaleDateString('ru-RU', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
      }

      const newBook = await addBook(dataToSave);

      try {
        await saveToGlobalBooks(newBook.title, newBook.author, newBook.cover_url);
        console.log('✅ Книга проверена/сохранена в global_books:', newBook.title);
      } catch (globalError) {
        console.error('❌ Не удалось сохранить в global_books:', globalError);
      }

      if (status === 'want') {
        setWantBooks((prev) => [newBook, ...prev]);
      } else if (status === 'reading') {
        setReadingBooks((prev) => [newBook, ...prev]);
      } else if (status === 'read') {
        const updatedReadBooks = [newBook, ...readBooks];
        setReadBooks(updatedReadBooks);
        // При добавлении сразу в "Прочитал" создаем запись "закончил читать"
        await logActivity('finished', newBook);
        await checkAndLogGoal(updatedReadBooks);
      }
      
      return newBook;
    } catch (error) {
      console.error('Ошибка добавления книги:', error);
      Alert.alert('Ошибка', 'Не удалось добавить книгу: ' + error.message);
      throw error;
    }
  };

  const moveToReading = async (book) => {
    try {
      const updatedBook = await updateBook(book.id, {
        status: 'reading',
        start_date: new Date().toLocaleDateString('ru-RU', {
          day: 'numeric', month: 'long', year: 'numeric',
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
          day: 'numeric', month: 'long', year: 'numeric',
        }),
      });

      const updatedReadBooks = [updatedBook, ...readBooks];
      setReadingBooks((prev) => prev.filter((b) => b.id !== book.id));
      setReadBooks(updatedReadBooks);
      
      await checkAndLogGoal(updatedReadBooks);

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

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090B' }}>
        <ActivityIndicator size="large" color="#B2D100" />
      </View>
    );
  }

  return (
    <AutocompleteDropdownContextProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          ) : (
            <>
              <Stack.Screen name="Home" options={{ headerShown: false }}>
                {(props) => <HomeScreen {...props} user={user} />}
              </Stack.Screen>

              <Stack.Screen name="Community" component={CommunityScreen} options={{ headerShown: false }} />
              
              <Stack.Screen name="Tracker" options={{ headerShown: false }}>
                {(props) => (
                  <TrackerScreen
                    {...props}
                    wantBooks={wantBooks}
                    readingBooks={readingBooks}
                    readBooks={readBooks}
                    allBooks={[...wantBooks, ...readingBooks, ...readBooks]}
                    setWantBooks={setWantBooks}
                    setReadingBooks={setReadingBooks}
                    setReadBooks={setReadBooks}
                    moveToReading={moveToReading}
                    moveToRead={moveToRead}
                    onAddBook={handleAddBook}        
                    onDeleteBook={handleDeleteBook}  
                    onRefresh={loadBooks} 
                    onUpdateBook={handleUpdateBook}
                  />
                )}
              </Stack.Screen>
              
              <Stack.Screen name="MyGoal" component={MyGoalScreen} options={{ headerShown: false }} />
              <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ headerShown: false }} />
              
              <Stack.Screen name="Settings" options={{ headerShown: false }}>
                {(props) => <SettingsScreen {...props} user={user} onUpdateUser={setUser} />}
              </Stack.Screen>

              <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AutocompleteDropdownContextProvider>
  );
}

export default App;