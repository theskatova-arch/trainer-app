import React from 'react';
import BookListScreen from './BookListScreen';

function ReadScreen({ 
  books, 
  setBooks, 
  navigation,
  onUpdateBook,
  onDeleteBook,
  onAddBook   
}) {
  return (
    <BookListScreen
      title="Прочитал"
      iconName="checkmark-circle"
      books={books}        
      setBooks={setBooks}  
      showDatePicker={true} // 👈 Оставили только один пропс (он всегда true для этой вкладки)
      navigation={navigation}
      onUpdateBook={onUpdateBook}
      deleteBook={onDeleteBook}
      onAddBook={onAddBook}
    />
  );
}

export default ReadScreen;