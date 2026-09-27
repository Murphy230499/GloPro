import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('service').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Service keys:", Object.keys(data[0]));
  }
}
run();
