import React from 'react';
import BookListScreen from './BookListScreen';

function ReadingScreen({ 
  books, 
  setBooks, 
  moveToRead,
  onUpdateBook,
  onDeleteBook,  
  navigation  }) {
  return (
    <BookListScreen
      title="Читаю"
      iconName="book"
      books={books}
      setBooks={setBooks}
      onMoveToRead={moveToRead}
      onUpdateBook={onUpdateBook}
      deleteBook={onDeleteBook}  
      navigation={navigation}  
    />
  );
}

export default ReadingScreen;