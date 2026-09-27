import { base44 } from './src/api/base44Client.js';
async function run() {
  try {
    const list = await base44.entities.Appointment.list();
    if (list.length > 0) {
      console.log(Object.keys(list[0]));
    } else {
      console.log("No appointments found");
    }
  } catch(e) { console.error(e) }
}
run();
