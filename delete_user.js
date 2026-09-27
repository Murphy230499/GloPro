const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function run() {
  const email = 'duclivegiolinh@gmail.com';
  console.log(`Fetching users via REST API...`);
  
  // List users
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  
  if (!listRes.ok) {
    console.error("Failed to list users:", await listRes.text());
    return;
  }
  
  const usersData = await listRes.json();
  const user = usersData.users.find(u => u.email === email);
  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }
  
  console.log(`Found user: ${user.id}. DELETING...`);
  
  const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  
  if (!deleteRes.ok) {
    console.error("Failed to delete user:", await deleteRes.text());
  } else {
    console.log("Successfully deleted user! They can now log in again to create a fresh account.");
  }
}

run();
