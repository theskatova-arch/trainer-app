import React from 'react';
import BookListScreen from './BookListScreen';

function ReadScreen({ books, setBooks, showDatePicker}) {
  return (
    <BookListScreen
      title="Прочитал"
      iconName="checkmark-circle"
      books={books}        // <-- Передаём массив
      setBooks={setBooks}  // <-- Передаём функцию
      showDatePicker={showDatePicker}
    />
  );
}

export default ReadScreen;