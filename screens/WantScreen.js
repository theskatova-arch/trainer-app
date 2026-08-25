import React from 'react';
import BookListScreen from './BookListScreen';

function WantScreen({ 
  books, 
  setBooks, 
  moveToReading,
  onAddBook,      // ✅ Принимаем
  onDeleteBook    // ✅ Принимаем
}) {
  return (
    <BookListScreen
      title="Хочу прочитать"
      iconName="bookmark"
      books={books}
      setBooks={setBooks}
      onMoveToReading={moveToReading}
      onAddBook={onAddBook}        // ✅ Передаём дальше
      onDeleteBook={onDeleteBook}  // ✅ Передаём дальше
    />
  );
}

export default WantScreen;