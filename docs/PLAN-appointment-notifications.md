# PLAN-global-notifications

## Task Breakdown
1. **Understand Context:** Add a global, bottom-right toaster notification system for 3 events: Auto No-Show, New Online Booking, Cancelled Online Booking. Popups must last 5 mins and replicate the Timeline View's appointment card styling.
2. **Global Notification Provider:** 
   - Create `src/components/GlobalNotificationProvider.jsx`.
   - Wrap `src/app/layout.jsx` with this provider.
   - Implement Supabase Realtime for `INSERT` (new booking) and `UPDATE` (cancelled booking).
   - Implement a polling interval to check for `pending` appointments that exceed the `noShowWaitTime` setting to trigger the Auto No-Show warning.
3. **UI Implementation:**
   - Create `src/components/GlobalNotificationToast.jsx`.
   - Replicate the exact design from the mockup.
   - Map appointment statuses to accurate colors.
   - Auto-dismiss after 5 minutes (300000 ms).
4. **Agent Assignments:**
   - `frontend-specialist`: For UI creation (Toast popup) and integrating with the Layout.
   - `backend-specialist`: For Realtime hooks and auto-no-show time calculation logic.

## Socratic Gate Questions
1. Should the system *automatically* change the status to `no_show` when the Auto No-Show popup appears, or is the popup just a reminder for the staff to manually call the client and update it?
2. Should the New/Cancelled notifications be triggered only by online bookings (`source = 'online'`), or by any booking created across the entire system?
3. What should the "View Appointment" button do? Should it open the Appointment Modal directly, or navigate the user to `/appointments`?

## Verification Checklist
- [ ] Notifications display globally (even on non-appointment pages).
- [ ] Realtime triggers work for new and cancelled online bookings.
- [ ] Time-based auto no-show trigger fires accurately based on user settings.
- [ ] UI perfectly matches the Timeline appointment card styles.
- [ ] Notifications automatically dismiss after 5 minutes.
