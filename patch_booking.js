import fs from 'fs';
let content = fs.readFileSync('src/views/PublicBookingPage.jsx', 'utf8');

// 1. Update Form State
content = content.replace(
  `  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null); // null = bất kỳ
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [expandedGroup, setExpandedGroup] = useState(null);`,
  `  const [selectedBranch, setSelectedBranch] = useState('');
  const [guests, setGuests] = useState([{ id: 1, service: null, staff: null, time: '' }]);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [expandedGroup, setExpandedGroup] = useState(null);`
);

// 2. Update getAvailableSlots
content = content.replace(
  /const availableSlots = useMemo[\s\S]*?}, \[selectedDate, setting, appointments, selectedStaff\]\);/,
  `const getAvailableSlots = useCallback((targetStaff) => {
    if (!selectedDate || !setting) return [];
    const dow = new Date(selectedDate + 'T00:00:00').getDay();
    const key = DAY_KEYS[dow];
    const wh = setting.working_hours?.[key];
    if (!wh?.enabled) return [];

    const slots = generateSlots(wh.open || '09:00', wh.close || '18:00', setting.slot_duration_minutes || 30);
    const now = new Date();
    const minMs = (setting.min_advance_hours || 1) * 3600000;

    return slots.filter(slot => {
      const slotDate = new Date(selectedDate + \`T\${slot}:00\`);
      if (slotDate - now < minMs) return false;

      if (!setting.allow_double_booking && targetStaff) {
        const conflict = appointments.some(a =>
          a.date === selectedDate &&
          a.time === slot &&
          a.staff_id === targetStaff.id &&
          a.status !== 'cancelled'
        );
        if (conflict) return false;
      }
      return true;
    });
  }, [selectedDate, setting, appointments]);`
);

// 3. Update handleSubmit
content = content.replace(
  /const isFormValid =[\s\S]*?};\n/,
  `const isFormValid = !!selectedDate && !!form.name.trim() && !!form.phone.trim() && guests.every(g => g.service && g.time);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setSubmitting(true);
    try {
      const code = \`BK-\${Date.now().toString().slice(-6)}\`;
      
      const payloadServices = guests.map(g => {
        const durationMins = g.service?.duration_minutes || 60;
        const [h, m] = g.time.split(':').map(Number);
        const endM = m + durationMins;
        const endH = h + Math.floor(endM / 60);
        const finalEndM = endM % 60;
        const endTimeStr = \`\${String(endH).padStart(2, '0')}:\${String(finalEndM).padStart(2, '0')}\`;
        return {
          service_id: g.service.id,
          service_name: g.service.name,
          staff_id: g.staff?.id || null,
          staff_name: g.staff?.name || 'Bất kỳ',
          start_time: g.time,
          end_time: endTimeStr,
          price: g.service.price || 0
        };
      });

      const totalPrice = payloadServices.reduce((sum, s) => sum + s.price, 0);

      await base44.entities.Appointment.create({
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        note: (form.note || '') + \` (Mã: \${code})\`,
        service_name: payloadServices.map(s => s.service_name).join(' + '),
        service_id: payloadServices[0]?.service_id || null,
        staff_id: payloadServices[0]?.staff_id || null,
        staff_name: payloadServices[0]?.staff_name || 'Bất kỳ',
        date: selectedDate,
        start_time: payloadServices[0]?.start_time || '00:00',
        end_time: payloadServices[payloadServices.length-1]?.end_time || '01:00',
        status: setting?.auto_confirm ? 'confirmed' : 'pending',
        source: 'online',
        branch_id: selectedBranch || setting?.branch_id || null,
        price: totalPrice,
        services: payloadServices
      });
      setBookingCode(code);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert('Đặt lịch thất bại: ' + (e.message || e));
    } finally {
      setSubmitting(false);
    }
  };
`
);

// We need to replace the entire Left Column and Right Column body UI.
// Instead of replacing manually with regex, we'll write the whole return statement properly.
fs.writeFileSync('src/views/PublicBookingPage.jsx', content);
