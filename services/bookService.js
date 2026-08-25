import { supabase } from '../lib/supabase';

// Получить ID текущего пользователя
const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Пользователь не авторизован');
      throw new Error('Пользователь не авторизован');
    }
    console.log('✅ ID пользователя:', user.id);
    return user.id;
  } catch (error) {
    console.error('❌ Ошибка получения пользователя:', error);
    throw error;
  }
};

// ✅ Получить все книги пользователя
export const fetchBooks = async () => {
  try {
    console.log('📚 Загружаем книги...');
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Ошибка загрузки книг:', error);
      throw error;
    }

    console.log(`✅ Загружено ${data?.length || 0} книг`);
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка в fetchBooks:', error);
    return []; // Возвращаем пустой массив при ошибке
  }
};

// ✅ Добавить книгу
export const addBook = async (bookData) => {
  try {
    console.log('📚 bookService.addBook вызван с данными:', bookData);
    
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('books')
      .insert([
        {
          ...bookData,
          user_id: userId,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка Supabase:', error);
      throw error;
    }

    console.log('✅ Книга сохранена в БД:', data);
    return data;
  } catch (error) {
    console.error('❌ Ошибка добавления книги:', error);
    throw error;
  }
};

// ✅ Обновить книгу
export const updateBook = async (id, updates) => {
  try {
    console.log('📝 Обновляем книгу:', id, updates);
    
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка обновления:', error);
      throw error;
    }

    console.log('✅ Книга обновлена:', data);
    return data;
  } catch (error) {
    console.error('❌ Ошибка обновления книги:', error);
    throw error;
  }
};

// ✅ Удалить книгу
export const deleteBook = async (id) => {
  try {
    console.log('🗑️ Удаляем книгу:', id);
    
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Ошибка удаления:', error);
      throw error;
    }

    console.log('✅ Книга удалена');
    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления книги:', error);
    throw error;
  }
};

// ✅ Выйти из аккаунта
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Ошибка выхода:', error);
    throw error;
  }
};