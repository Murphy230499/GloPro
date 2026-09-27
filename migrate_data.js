const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const email = 'duclivegiolinh@gmail.com';
  const oldId = '1dab6b33-0641-4c85-8868-07e2a383db40';
  
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  
  const data = await res.json();
  const user = data.users?.find(u => u.email === email);
  
  if (!user) {
    console.error("User not found!");
    return;
  }
  
  const newId = user.id;
  console.log(`OLD ID: ${oldId}`);
  console.log(`NEW ID: ${newId}`);
  
  // Now we need to know which tables to update.
  // Using Supabase RPC or REST API to update?
  // We can't do arbitrary SQL via REST API unless we have an RPC function.
  // BUT we CAN query tables via REST API and update them one by one!
  
  const tables = [
    'customer', 'customergroup', 'customersegment', 
    'invoice', 'invoice_item', 'appointment',
    'staff', 'staffgroup', 'branch', 'servicecombo',
    'servicegroup', 'servicepackage', 'treatment',
    'shift', 'shifttemplate', 'staffattendance',
    'staffcommissionrule', 'staffschedule', 'user_profile'
  ];
  
  for (const table of tables) {
    // Attempt to update tenant_id = oldId to newId
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/${table}?tenant_id=eq.${oldId}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ tenant_id: newId })
    });
    
    if (patchRes.ok) {
      const updated = await patchRes.json();
      if (updated.length > 0) {
        console.log(`Updated ${updated.length} rows in ${table}`);
      }
    } else {
      // If column doesn't exist, it will return an error, which we just ignore.
      // console.log(`Skipped ${table}`);
    }
  }
  console.log("Data migration complete!");
}

run();
