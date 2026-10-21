import { supabase } from '../lib/supabase';

// Получить ID текущего пользователя
const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Пользователь не авторизован');
    return user.id;
  } catch (error) {
    console.error('❌ Ошибка получения пользователя:', error);
    throw error;
  }
};

// ✅ Получить все книги пользователя
export const fetchBooks = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка в fetchBooks:', error);
    return [];
  }
};

// ✅ Добавить книгу
export const addBook = async (bookData) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('books')
      .insert([{ ...bookData, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Ошибка добавления книги:', error);
    throw error;
  }
};

// ✅ Обновить книгу
export const updateBook = async (id, updates) => {
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ✅ Удалить книгу
export const deleteBook = async (id) => {
  try {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления книги:', error);
    throw error;
  }
};

// ✅ Сохранить книгу в глобальную базу
export const saveToGlobalBooks = async (title, author, cover_url) => {
  try {
    if (!title || title.trim() === '') return;

    const cleanTitle = title.trim();

    const { data: existing, error: searchError } = await supabase
      .from('global_books')
      .select('id')
      .ilike('title', cleanTitle) 
      .limit(1);

    if (searchError) {
      console.error('Ошибка при проверке книги:', searchError);
      return;
    }

    if (existing && existing.length > 0) {
      return;
    }

    const { error: insertError } = await supabase
      .from('global_books')
      .insert([{ 
        title: cleanTitle, 
        author: author || 'Автор неизвестен', 
        cover_url: cover_url || null 
      }]);

    if (insertError) {
      console.error('Ошибка вставки в global_books:', insertError);
    }
  } catch (error) {
    console.error('Ошибка сохранения в глобальную базу:', error);
  }
};

// ✅ Поиск книги (ТОЛЬКО Глобальная база, внешний API отключен)
export const searchBooksOnline = async (query) => {
  try {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    // Запрос только к Supabase
    const { data: localResponse, error: localError } = await supabase
      .from('global_books')
      .select('*')
      .ilike('title', `%${cleanQuery}%`)
      .limit(10);

    if (localError) throw localError;

    // Обрабатываем результат из Supabase
    let localResults = [];
    if (localResponse) {
      localResults = localResponse.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        cover: book.cover_url,
        isLocal: true // Все результаты теперь из базы
      }));
    }

    return localResults;

  } catch (error) {
    console.error('Ошибка при поиске книг:', error);
    return [];
  }
};

// ✅ Получить книги конкретного пользователя (для профиля)
export const fetchUserBooks = async (userId) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Ошибка получения книг пользователя:', error);
    return [];
  }
  
  return data;
};

// ✅ Получить данные комьюнити (средняя оценка + список отзывов)
export const fetchCommunityData = async (title, author) => {
  try {
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('user_id, rating, review')
      .eq('title', title)
      .eq('author', author)
      .gt('rating', 0);

    if (booksError) throw booksError;

    if (!booksData || booksData.length === 0) {
      return { average: 0, count: 0, reviews: [] };
    }

    const uniqueUsers = new Map();
    booksData.forEach(item => {
      const numericRating = Number(item.rating);
      if (!isNaN(numericRating) && numericRating >= 1 && numericRating <= 5) {
        uniqueUsers.set(item.user_id, item); 
      }
    });

    const uniqueData = Array.from(uniqueUsers.values());

    const ratings = uniqueData.map(item => Number(item.rating));
    const count = ratings.length;
    const sum = ratings.reduce((acc, curr) => acc + curr, 0);
    const average = count > 0 ? (sum / count).toFixed(1) : 0;

    const { data: feedData } = await supabase
      .from('activity_feed')
      .select('user_id, username')
      .eq('book_title', title);
    
    const usernames = {};
    if (feedData) {
      feedData.forEach(f => {
        usernames[f.user_id] = f.username;
      });
    }

    const reviews = uniqueData
      .filter(item => item.review && item.review.trim() !== '')
      .map(item => ({
        id: item.user_id,
        username: usernames[item.user_id] || 'Пользователь',
        rating: Number(item.rating) || 0,
        text: item.review
      }));

    return { average, count, reviews };
  } catch (error) {
    console.error('Ошибка получения данных комьюнити:', error);
    return { average: 0, count: 0, reviews: [] };
  }
};

// ✅ Проверить, было ли уже событие о выполнении цели в этом году
export const checkGoalCompletionLogged = async (goal) => {
  try {
    const userId = await getCurrentUserId();
    const currentYear = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('activity_feed')
      .select('id')
      .eq('user_id', userId)
      .eq('action_type', 'goal_completed')
      .gte('created_at', `${currentYear}-01-01`)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Ошибка проверки события цели:', error);
    return false;
  }
};

// ✅ Записать действие в ленту
export const logActivity = async (action_type, book, extraData = {}) => {
  try {
    const userId = await getCurrentUserId();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // 👇 Берем ник отовсюду, где он может быть 👇
    const username = user?.user_metadata?.username 
      || user?.user_metadata?.display_name 
      || user?.user_metadata?.['Display name'] 
      || user?.email?.split('@')[0] 
      || 'Пользователь';

    const { error } = await supabase
      .from('activity_feed')
      .insert([{
        user_id: userId,
        username: username,
        action_type: action_type,
        book_id: book?.id || null,
        book_title: book?.title || extraData.custom_title || null,
        book_author: book?.author || null,
        rating: extraData.rating || null,
        review_text: extraData.review_text || extraData.custom_text || null,
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Ошибка добавления в ленту:', error);
  }
};

// ✅ Получить ленту событий
export const fetchActivityFeed = async () => {
  try {
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Ошибка загрузки ленты:', error);
    return [];
  }
};

// ✅ Выйти из аккаунта
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
};