import { base44 } from './src/api/base44Client.js';

async function run() {
  const svcs = await base44.entities.Service.list().catch(() => []);
  if (svcs.length > 0) {
    console.log("Service fields:", Object.keys(svcs[0]));
    console.log("Sample service:", svcs[0]);
  }
}
run();
