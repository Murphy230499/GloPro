import { supabase } from '../../src/api/supabaseClient.js';

async function inspect() {
  const { data: mems, error: e1 } = await supabase.from('membership').select('*');
  const { data: trts, error: e2 } = await supabase.from('customer_treatment').select('*');
  const { data: pkgs, error: e3 } = await supabase.from('customer_package').select('*');
  const { data: invs, error: e4 } = await supabase.from('invoice').select('*');
  
  console.log('--- MEMBERSHIPS ---');
  console.log(mems);
  console.log('--- CUSTOMER TREATMENTS ---');
  console.log(trts);
  console.log('--- CUSTOMER PACKAGES ---');
  console.log(pkgs);
  console.log('--- INVOICES ---');
  console.log(invs);
}

inspect().catch(console.error);
