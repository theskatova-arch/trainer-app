import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import TrackerScreen from './screens/TrackerScreen';

const Stack = createNativeStackNavigator();

function App() {
  // Глобальные состояния для трёх списков
  const [wantBooks, setWantBooks] = useState([]);
  const [readingBooks, setReadingBooks] = useState([]);
  const [readBooks, setReadBooks] = useState([]);

  // Функция для перемещения книги из "Хочу" в "Читаю"
  const moveToReading = (book) => {
    // Добавляем дату начала к книге
    const bookWithDate = {
      ...book,
      startDate: new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    // Удаляем книгу из списка "Хочу"
    setWantBooks((prev) => prev.filter((b) => b.id !== book.id));
    // Добавляем книгу в список "Читаю" с датой
    setReadingBooks((prev) => [...prev, bookWithDate]);
  };

  // Функция для перемещения книги из "Читаю" в "Прочитал"
  const moveToRead = (book) => {
  const bookWithFinishDate = {
    ...book,
    finishDate: new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };

  // Удаляем из "Читаю"
  setReadingBooks((prev) => prev.filter((b) => b.id !== book.id));
  // Добавляем в "Прочитал"
  setReadBooks((prev) => [...prev, bookWithFinishDate]);
};

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Главный экран */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />

        {/* Экран трекера с пропсами */}
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
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;