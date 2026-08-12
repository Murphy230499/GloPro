async function run() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log("Error:", data);
}
run();
