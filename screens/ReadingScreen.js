import React from 'react';
import BookListScreen from './BookListScreen';

function ReadingScreen({ 
  books, 
  setBooks, 
  moveToRead,
  onUpdateBook,
  onDeleteBook,  
  navigation,
  onAddBook  }) {
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
      onAddBook={onAddBook}
    />
  );
}

export default ReadingScreen;