import React from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Alert } from 'react-native';

// @ts-nocheck
function HomeScreen({ navigation }) {
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мой книжный помощник</Text>
      

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
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF', // Синий фон как у стандартной кнопки
    paddingVertical: 15, // Внутренний отступ сверху-снизу (делает кнопку выше)
    paddingHorizontal: 40, // Внутренний отступ слева-справа (делает кнопку шире)
    borderRadius: 10, // Скругление углов
    marginBottom: 15, // Отступ между кнопками
    width: '80%', // Ширина кнопки
    alignItems: 'center', // Центрируем текст внутри
  },
  buttonText: {
    color: '#fff',
  }

});

export default HomeScreen;