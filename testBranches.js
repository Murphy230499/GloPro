import { supabaseClient } from './src/api/supabaseClient.js';
async function run() {
  try {
    const list = await supabaseClient.entities.Branch.list();
    console.log(list.map(b => ({id: b.id, name: b.name})));
  } catch(e) { console.error(e) }
}
run();
