import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('hello'); // Trigger an error to see if we can get schema, or just select 1 row to see types if we can fetch
  const { data: cols } = await supabase.from('appointment').select().limit(1);
  console.log("Cols:", cols);
}
check();
