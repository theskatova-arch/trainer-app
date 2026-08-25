import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { supabase } from '../lib/supabase';

function HomeScreen({ navigation }) {
  
  // Функция выхода
  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              // Navigation автоматически перенаправит на экран входа
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось выйти');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Мой книжный помощник</Text>
      
      <TouchableOpacity  
        style={styles.button}
        onPress={() => Alert.alert('Книга дня', 'Сегодня читаем "Мастер и Маргарита"')}
      >
        <Text style={styles.buttonText}>Моя цель</Text>
      </TouchableOpacity>
      
      <TouchableOpacity  
        style={styles.button}
        onPress={() => navigation.navigate('Tracker')}
      >
        <Text style={styles.buttonText}>Трекер чтения</Text>
      </TouchableOpacity>
      
      <TouchableOpacity  
        style={styles.button}
        onPress={() => Alert.alert('Статистика', 'Ты прочитала 0 книг')} 
      >
        <Text style={styles.buttonText}>Комьюнити</Text> 
      </TouchableOpacity>

      {/* Кнопка выхода */}
      <TouchableOpacity  
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>🚪 Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
});

export default HomeScreen;