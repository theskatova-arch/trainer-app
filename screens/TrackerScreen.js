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
  moveToRead
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
      {/* Вкладка "Хочу" */}
      <Tab.Screen name="Хочу">
        {(props) => (
    <WantScreen
      {...props}
      books={wantBooks}
      setBooks={setWantBooks}      
      moveToReading={moveToReading}
      moveToRead={moveToRead}
    />
  )}
</Tab.Screen>

      {/* Вкладка "Читаю" — теперь с пропсами */}
     <Tab.Screen name="Читаю">
  {(props) => (
    <ReadingScreen
      {...props}
      books={readingBooks}        // <-- Передаём массив
      setBooks={setReadingBooks}
      moveToRead={moveToRead}
    />
  )}
</Tab.Screen>

      {/* Вкладка "Прочитал" — теперь с пропсами */}
      <Tab.Screen name="Прочитал">
        {(props) => (
          <ReadScreen
            {...props}
            books={readBooks}
            setBooks={setReadBooks}
            showDatePicker={true}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default TrackerScreen;