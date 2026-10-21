import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity 
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WantScreen from './WantScreen';
import ReadingScreen from './ReadingScreen';
import ReadScreen from './ReadScreen';

const Tab = createBottomTabNavigator();

// Палитра 2027
const LIME_ACCENT = '#B2D100';
const TEXT_WHITE = '#FFFFFF';
const TEXT_MUTED = '#A0A0B0';
const BG_DARK = '#09090B';

// 👇 КАСТОМНЫЙ ТАБ-БАР (Стеклянный) 👇
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { bottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }]}>
      <BlurView intensity={40} tint="dark" style={styles.tabBarGlass}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItemWrapper}
            >
              <Text
                style={[
                  styles.tabText,
                  isFocused && styles.tabTextActive
                ]}
              >
                {route.name}
              </Text>
              
              {/* Неоновый индикатор активной вкладки */}
              {isFocused && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

function TrackerScreen({ 
  wantBooks, 
  readingBooks, 
  readBooks, 
  allBooks,
  setWantBooks, 
  setReadingBooks, 
  setReadBooks, 
  moveToReading, 
  moveToRead,
  onAddBook,      
  onDeleteBook,
  onRefresh,
  onUpdateBook,
  navigation 
}) {
  useFocusEffect(
    useCallback(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, [onRefresh])
  );

  return (
    <View style={styles.container}>
      {/* Фоновые ауры для всего экрана */}
      <View style={styles.auraPurple} />
      <View style={styles.auraLime} />

      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift', 
        }}
      >
        <Tab.Screen name="Хочу">
          {(props) => (
            <WantScreen
              {...props}
              navigation={navigation} 
              books={wantBooks}
              setBooks={setWantBooks}
              moveToReading={moveToReading}
              onAddBook={onAddBook}       
              onDeleteBook={onDeleteBook} 
              onUpdateBook={onUpdateBook} 
              allBooks={allBooks}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Читаю">
          {(props) => (
            <ReadingScreen
              {...props}
              navigation={navigation}
              books={readingBooks}
              setBooks={setReadingBooks}
              moveToRead={moveToRead}
              onAddBook={onAddBook}        
              onDeleteBook={onDeleteBook} 
              onUpdateBook={onUpdateBook}  
              allBooks={allBooks}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Прочитал">
          {(props) => (
            <ReadScreen
              {...props}
              navigation={navigation}
              books={readBooks}
              setBooks={setReadBooks}
              showDatePicker={true}
              onAddBook={onAddBook}        
              onDeleteBook={onDeleteBook} 
              onUpdateBook={onUpdateBook} 
              allBooks={allBooks} 
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  
  auraPurple: {
    position: 'absolute',
    top: -50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#6B46C1',
    opacity: 0.2,
  },
  auraLime: {
    position: 'absolute',
    bottom: 0,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: LIME_ACCENT,
    opacity: 0.1,
  },

  tabBarContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarGlass: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tabItemWrapper: {
    flex: 1,          
    height: '100%',   
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: TEXT_MUTED,
    marginBottom: 4, 
  },
  tabTextActive: {
    color: TEXT_WHITE,
    textShadowColor: 'rgba(178, 209, 0, 0.5)', 
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: LIME_ACCENT,
    shadowColor: LIME_ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default TrackerScreen;