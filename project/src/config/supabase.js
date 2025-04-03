const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Test the connection with error handling
const testConnection = async () => {
  try {
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error.message);
    if (error.message.includes('Origin DNS error')) {
      console.error('DNS resolution failed. Please check your Supabase URL and internet connection.');
    }
    return false;
  }
};

// Initialize connection test
testConnection();

module.exports = supabase;