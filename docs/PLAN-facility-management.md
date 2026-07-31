# PLAN: Facility Management

## 1. Goal
Add a dynamic Location/Chair/Bed (Facility) management system to the Appointment module. Users can create, edit, and delete facilities, and configure which services each facility supports.

## 2. Open Questions
- Should a Facility be tied strictly to a single Branch? (Assuming yes)
- Should selecting a Service during appointment creation automatically filter the Facility dropdown? (Assuming yes)

## 3. Tasks Breakdown

### Phase 1: Backend Integration
- [ ] Update `src/api/base44Client.js` to include `Facility: createEntityAdapter('facility')`.

### Phase 2: UI Component (Management Modal)
- [ ] Create `src/components/appointments/FacilityManagementModal.jsx`.
- [ ] Implement list view of existing facilities.
- [ ] Implement create/edit form (Name, Applicable Services, Active Status).
- [ ] Implement delete functionality.

### Phase 3: Appointment Header Integration
- [ ] Modify `src/components/appointments/AppointmentHeader.jsx` to include an "Armchair" icon button.
- [ ] Wire the button to open `FacilityManagementModal`.

### Phase 4: Data Flow & Service Filtering
- [ ] Modify `src/views/Appointments.jsx` to fetch `base44.entities.Facility.list()` instead of using `DEFAULT_FACILITIES`.
- [ ] Modify `src/components/AppointmentModal.jsx` to filter the facility dropdown based on selected services and the facility's `applicable_services` field.

## 4. Verification Checklist
- [ ] Can create a new facility with specific allowed services.
- [ ] New facility appears in timeline and calendar view.
- [ ] Appointment modal correctly filters facilities when a service is selected.
- [ ] Can edit and delete facilities.
