import 'react-native-url-polyfill/auto'; // 👈 Важно для стабильной работы
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,           // 👈 Говорим Supabase хранить сессию в AsyncStorage
    autoRefreshToken: true,
    persistSession: true,            // 👈 Включаем сохранение сессии
    detectSessionInUrl: false,       // 👈 Для мобильных приложений это должно быть false
  },
});