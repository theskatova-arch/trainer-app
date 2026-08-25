import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import WantScreen from './WantScreen';
import ReadingScreen from './ReadingScreen';
import ReadScreen from './ReadScreen';

const Tab = createBottomTabNavigator();

function TrackerScreen({ 
  wantBooks, 
  readingBooks, 
  readBooks, 
  setWantBooks, 
  setReadingBooks, 
  setReadBooks, 
  moveToReading, 
  moveToRead,
  onAddBook,      // ✅ Принимаем
  onDeleteBook    // ✅ Принимаем
}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Хочу') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Читаю') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Прочитал') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Хочу">
        {(props) => (
          <WantScreen
            {...props}
            books={wantBooks}
            setBooks={setWantBooks}
            moveToReading={moveToReading}
            onAddBook={onAddBook}        // ✅ Передаём дальше
            onDeleteBook={onDeleteBook}  // ✅ Передаём дальше
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Читаю">
        {(props) => (
          <ReadingScreen
            {...props}
            books={readingBooks}
            setBooks={setReadingBooks}
            moveToRead={moveToRead}
            onAddBook={onAddBook}        // ✅ Передаём дальше
            onDeleteBook={onDeleteBook}  // ✅ Передаём дальше
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Прочитал">
        {(props) => (
          <ReadScreen
            {...props}
            books={readBooks}
            setBooks={setReadBooks}
            showDatePicker={true}
            onAddBook={onAddBook}        // ✅ Передаём дальше
            onDeleteBook={onDeleteBook}  // ✅ Передаём дальше
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default TrackerScreen;