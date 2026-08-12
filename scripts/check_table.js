import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.from('invoice').select('*').limit(1);
  console.log("Invoice:", error || data);
  const { data: d2, error: e2 } = await supabase.from('product').select('*').limit(1);
  console.log("Product:", e2 || d2);
  const { data: d3, error: e3 } = await supabase.from('customer_groups').select('*').limit(1);
  console.log("Customer Groups:", e3 || d3);
  const { data: d4, error: e4 } = await supabase.from('customergroup').select('*').limit(1);
  console.log("customergroup:", e4 || d4);
}
run();
