import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgdzjnwiubsdjeaonpnt.supabase.co';
const supabaseKey = (typeof window === 'undefined')
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_IRdxMgt8SG24Fs-tnpJhUA_qpuafahe')
  : (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_IRdxMgt8SG24Fs-tnpJhUA_qpuafahe');

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class WebSocket {};
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
  global: {
    fetch: (url, options = {}) => {
      options.cache = 'no-store';
      return fetch(url, options);
    }
  }
});

/**
 * Generic Supabase Database Cloud Persistence Helpers
 * Directly syncs data with Supabase Cloud Database (PostgreSQL) instead of localStorage.
 */

export async function dbSelect(table, query = '*') {
  try {
    const { data, error } = await supabase.from(table).select(query);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`[Supabase Cloud DB Select Error - ${table}]:`, err);
    return [];
  }
}

export async function dbInsert(table, payload) {
  try {
    const { data, error } = await supabase.from(table).insert(payload).select();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`[Supabase Cloud DB Insert Error - ${table}]:`, err);
    throw err;
  }
}

export async function dbUpdate(table, id, payload) {
  try {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`[Supabase Cloud DB Update Error - ${table}]:`, err);
    throw err;
  }
}

export async function dbDelete(table, id) {
  try {
    const { data, error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`[Supabase Cloud DB Delete Error - ${table}]:`, err);
    throw err;
  }
}
