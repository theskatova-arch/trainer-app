import React from 'react';
import BookListScreen from './BookListScreen';

function WantScreen({ books, setBooks, moveToReading }) {
  return (
    <BookListScreen
      title="Хочу прочитать"
      iconName="bookmark"
      books={books}
      setBooks={setBooks}          
      onMoveToReading={moveToReading}
    />
  );
}

export default WantScreen;