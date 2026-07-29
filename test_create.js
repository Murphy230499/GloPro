import { base44 } from './src/api/base44Client.js';

async function run() {
  try {
    const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
    const newInv = await base44.entities.Invoice.create({
      invoice_code: saleCode,
      customer_name: 'Khách vãng lai',
      customer_id: null,
      branch_id: null, // this will probably fail
      items: [{
        name: 'test',
        type: 'service',
        price: 100,
        qty: 1,
        staff_id: '',
        staff_name: '',
        is_customer_requested: true // this might fail if additionalProps is false
      }],
      subtotal: 0,
      discount: 0,
      total: 0,
      tip: 0,
      status: 'unpaid',
      date: new Date().toISOString()
    });
    console.log('Success:', newInv);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
