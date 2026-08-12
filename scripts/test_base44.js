import { createClient as createBase44Client } from '@base44/sdk';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;

const base44 = createBase44Client({
  appId: "6a4735b4c553e403102d4a69",
  serverUrl: process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL,
  headers: {
    "api_key": "1326ad962f25440c9e4559736d8aec18"
  }
});

async function run() {
  try {
    const data = await base44.entities.Invoice.list({ limit: 5 });
    console.log("Invoice Data length:", data?.length);
  } catch (e) {
    console.error("SDK Error:", e);
  }
}
run();
