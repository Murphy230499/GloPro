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
  
  console.log(`Found user: ${user.id}`);
  
  // Clear avatar_url from user_metadata
  const metadata = user.user_metadata || {};
  if (metadata.avatar_url && metadata.avatar_url.length > 500) {
    console.log(`Avatar URL is huge (${metadata.avatar_url.length} chars). Clearing it...`);
    
    metadata.avatar_url = null; // Clear it
    
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_metadata: metadata
      })
    });
    
    if (!updateRes.ok) {
      console.error("Failed to update user:", await updateRes.text());
    } else {
      console.log("Successfully cleared huge avatar_url from user_metadata!");
    }
  } else {
    console.log("User metadata avatar_url is not huge. Nothing to clear.");
    console.log("Current metadata:", metadata);
  }
}

run();
