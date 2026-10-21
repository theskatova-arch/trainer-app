import React from 'react';
import BookListScreen from './BookListScreen';

function ReadScreen({ 
  books, 
  setBooks, 
  showDatePicker,
  navigation,
  onUpdateBook,
  onDeleteBook  
   
}) {
  return (
    <BookListScreen
      title="Прочитал"
      iconName="checkmark-circle"
      books={books}        // <-- Передаём массив
      setBooks={setBooks}  // <-- Передаём функцию
      showDatePicker={showDatePicker}
      navigation={navigation}
      onUpdateBook={onUpdateBook}
      deleteBook={onDeleteBook}
    />
  );
}

export default ReadScreen;