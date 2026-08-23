import React from 'react';
import BookListScreen from './BookListScreen';

function ReadingScreen({ books, setBooks, moveToRead }) {
  return (
    <BookListScreen
      title="Читаю"
      iconName="book"
      books={books}
      setBooks={setBooks}
      onMoveToRead={moveToRead}
    />
  );
}

export default ReadingScreen;