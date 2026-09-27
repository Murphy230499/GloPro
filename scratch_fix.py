import re

# Fix index.tsx
with open("/Volumes/Coding/glopro-mobile/src/app/(tabs)/index.tsx", "r") as f:
    content = f.read()
content = content.replace("(k) => staffMap", "(k: any) => staffMap")
content = content.replace("(k) => customerMap", "(k: any) => customerMap")
with open("/Volumes/Coding/glopro-mobile/src/app/(tabs)/index.tsx", "w") as f:
    f.write(content)

# Fix CreateAppointmentModal.tsx
with open("/Volumes/Coding/glopro-mobile/src/components/appointments/CreateAppointmentModal.tsx", "r") as f:
    content = f.read()

content = content.replace("base44.entities.Customer.list()", "supabase.from('customers').select('*').then(res => res.data || [])")
content = content.replace("base44.entities.Service.list()", "supabase.from('services').select('*').then(res => res.data || [])")
content = content.replace("base44.entities.Staff.list()", "supabase.from('staff').select('*').then(res => res.data || [])")

with open("/Volumes/Coding/glopro-mobile/src/components/appointments/CreateAppointmentModal.tsx", "w") as f:
    f.write(content)

# Fix AppointmentDetailModal.tsx
with open("/Volumes/Coding/glopro-mobile/src/components/appointments/AppointmentDetailModal.tsx", "r") as f:
    content = f.read()
content = content.replace("setStaffList(stfRes)", "setStaffList(stfRes || [])")
with open("/Volumes/Coding/glopro-mobile/src/components/appointments/AppointmentDetailModal.tsx", "w") as f:
    f.write(content)
