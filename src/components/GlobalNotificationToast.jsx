import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CalendarPlus, CalendarX, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalNotificationToast({ notif, onClose }) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide up animation trigger
    setIsVisible(true);
    
    // Auto dismiss after 5 minutes
    const timer = setTimeout(() => {
      handleClose();
    }, 5 * 60 * 1000); // 5 mins

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // wait for animation
  };

  const a = notif.appointment;
  
  // Configuration based on notification type
  let config = {};
  if (notif.type === 'noshow') {
    config = {
      icon: <AlertCircle className="w-6 h-6 text-pink-500" />,
      iconBg: 'bg-pink-50',
      iconBorder: 'border-pink-100',
      title: 'Thông báo trễ giờ',
      message: (
        <>
          Lịch hẹn <strong>{a.start_time}</strong> vẫn chưa được Check-in. Hệ thống sẽ tự động chuyển sang <strong>Không đến (No Show)</strong>. Vui lòng liên hệ khách xác nhận.
        </>
      ),
      cardBorder: 'border-l-pink-500',
      cardBg: 'bg-pink-50/50'
    };
  } else if (notif.type === 'new') {
    config = {
      icon: <CalendarPlus className="w-6 h-6 text-blue-500" />,
      iconBg: 'bg-blue-50',
      iconBorder: 'border-blue-100',
      title: 'Lịch hẹn trực tuyến mới',
      message: (
        <>
          Khách hàng <strong>{a.customer_name}</strong> vừa đặt lịch mới trên hệ thống online.
        </>
      ),
      cardBorder: 'border-l-blue-500',
      cardBg: 'bg-blue-50/50'
    };
  } else if (notif.type === 'cancelled') {
    config = {
      icon: <CalendarX className="w-6 h-6 text-red-500" />,
      iconBg: 'bg-red-50',
      iconBorder: 'border-red-100',
      title: 'Khách hàng đã huỷ lịch',
      message: (
        <>
          Khách hàng <strong>{a.customer_name}</strong> đã huỷ lịch hẹn của họ trên hệ thống online.
        </>
      ),
      cardBorder: 'border-l-red-500',
      cardBg: 'bg-red-50/50'
    };
  }

  const handleView = () => {
    handleClose();
    if (window.location.pathname !== '/appointments') {
      router.push('/appointments');
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-appointment-modal', { detail: notif.appointment }));
    }, 100);
  };

  return (
    <div 
      className={`w-[400px] max-w-[90vw] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transition-all duration-300 transform pointer-events-auto ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
    >
      <div className="p-5 relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          {/* Icon */}
          <div className="shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${config.iconBorder} ${config.iconBg}`}>
              {config.icon}
            </div>
          </div>

          <div className="flex-1 space-y-4 pt-1">
            <div className="space-y-1.5 pr-6">
              <h3 className="font-semibold text-slate-800 leading-tight">{config.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {config.message}
              </p>
            </div>

            {/* Appointment Card Snippet */}
            <div className={`rounded-lg p-3 border-l-[6px] ${config.cardBorder} ${config.cardBg}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-slate-500">
                  {a.date} • {a.start_time} &rarr; {a.end_time || '...'}
                </span>
              </div>
              <div className="font-semibold text-slate-800 text-sm mb-1 truncate">
                {a.customer_name}
              </div>
              <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                <span className="truncate">{a.service_name || 'Dịch vụ Salon'}</span>
                {a.staff_name && (
                  <>
                    <span>•</span>
                    <span className="truncate">{a.staff_name}</span>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={handleView}
              className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 group"
            >
              Xem danh sách lịch hẹn
              <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
