'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import GlobalNotificationToast from './GlobalNotificationToast';

const GlobalNotificationContext = createContext();

export function useGlobalNotification() {
  return useContext(GlobalNotificationContext);
}

export default function GlobalNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const displayedNoShowIds = useRef(new Set()); // prevent duplicate noshow alerts

  const addNotification = (type, appointment) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, appointment }]);
    // Broadcast reload event to all listeners (e.g. Appointments.jsx)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('reload-data'));
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    // 1. Listen to Realtime DB Changes for New/Cancelled Online Bookings (Requires Supabase Realtime enabled)
    const channel = supabase
      .channel('global:appointment')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointment' }, (payload) => {
        const newAppt = payload.new;
        if (newAppt.source === 'online') {
          addNotification('new', newAppt);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointment' }, (payload) => {
        const newAppt = payload.new;
        const oldAppt = payload.old;
        if (newAppt.status === 'cancelled' && oldAppt.status !== 'cancelled') { // source might not be in payload.new on update
          addNotification('cancelled', newAppt);
        }
      })
      .subscribe();

    // 2. Poll every 10 seconds as a fallback for Realtime & Auto No-Show warnings
    let lastCheckedTime = new Date().toISOString();
    
    const pollDatabase = async () => {
      try {
        // --- Fallback for New Appointments ---
        const { data: newAppts } = await supabase
          .from('appointment')
          .select('*')
          .eq('source', 'online')
          .gt('created_at', lastCheckedTime)
          .order('created_at', { ascending: true });
          
        if (newAppts && newAppts.length > 0) {
          newAppts.forEach(appt => addNotification('new', appt));
          lastCheckedTime = newAppts[newAppts.length - 1].created_at;
        }

        // --- Auto No-Show Logic ---
        const stored = localStorage.getItem('glowpro_appointment_settings');
        if (!stored) return;
        const settings = JSON.parse(stored);
        if (!settings.autoNoShow && !settings.showNoShowPrompt) return;

        const waitMins = parseInt(settings.noShowWaitTime || '5', 10);
        const today = new Date().toLocaleDateString('en-CA');
        
        const { data: pendingAppts } = await supabase
          .from('appointment')
          .select('*')
          .eq('date', today)
          .eq('status', 'pending');

        if (!pendingAppts) return;

        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        pendingAppts.forEach(appt => {
          if (!appt.start_time) return;
          const [h, m] = appt.start_time.split(':').map(Number);
          const startMins = h * 60 + m;

          if (currentMins >= startMins + waitMins) {
            if (!displayedNoShowIds.current.has(appt.id)) {
              displayedNoShowIds.current.add(appt.id);
              addNotification('noshow', appt);
            }
          }
        });
      } catch (err) {
        console.error('Error polling database:', err);
      }
    };

    pollDatabase();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <GlobalNotificationContext.Provider value={{ addNotification }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
        {notifications.map(notif => (
          <GlobalNotificationToast 
            key={notif.id}
            notif={notif} 
            onClose={() => removeNotification(notif.id)} 
          />
        ))}
      </div>
    </GlobalNotificationContext.Provider>
  );
}
