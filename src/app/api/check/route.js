import { NextResponse } from 'next/server';
import { base44 } from '@/api/base44Client';

export async function GET() {
  try {
    const list = await base44.entities.Appointment.list();
    if (list.length > 0) {
      const first = list[0];
      const payload = { ...first, note: 'test edit' };
      const res = await base44.entities.Appointment.update(first.id, payload);
      return NextResponse.json({ success: true, res });
    }
    return NextResponse.json({ success: false, message: 'No appt' });
  } catch (e) {
    return NextResponse.json({ error: e.message, details: e }, { status: 500 });
  }
}
