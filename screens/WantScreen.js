import React from 'react';
import BookListScreen from './BookListScreen';

function WantScreen({ 
  books, 
  setBooks, 
  moveToReading,
  onAddBook,      
  onDeleteBook, 
  navigation,
  allBooks,
  onUpdateBook   
}) {
  return (
    <BookListScreen
      title="Хочу прочитать"
      iconName="bookmark"
      books={books}
      setBooks={setBooks}
      onMoveToReading={moveToReading}
      onAddBook={onAddBook}       
      deleteBook={onDeleteBook} 
      navigation={navigation}
      onUpdateBook={onUpdateBook}
      allBooks={allBooks}

    />
  );
}

export default WantScreen;