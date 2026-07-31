'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send, MailCheck, AlertTriangle, MailOpen, Search, Filter, ChevronLeft,
  ChevronRight, ChevronDown, Info, ExternalLink
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import AppointmentModal from '@/components/AppointmentModal';
import EditEventModal from '@/components/automations/EditEventModal';
import { toast } from '@/components/Layout';

// Mock recipient data with Vietnamese tags & names
const MOCK_RECIPIENTS = [
  {
    id: 'rec_1',
    name: 'Đặng Tuấn Anh',
    type: 'Khách quay lại',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    email: 'tuananh.dang@gmail.com',
    phone: '0905 218 922',
    channel: 'Email',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_101',
  },
  {
    id: 'rec_2',
    name: 'Thái Hoàng',
    type: 'Khách mới',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    email: '-',
    phone: '0959 599 3922',
    channel: 'Email',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_102',
  },
  {
    id: 'rec_3',
    name: 'Lê Thảo My',
    type: 'Khách quay lại',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    email: 'thaomy.le@hotmail.com',
    phone: '0914 908 317',
    channel: 'Email',
    dateTime: '31/10/2024 10:20',
    status: 'Failed',
    errorReason: 'Lỗi phản hồi máy chủ (500)!',
    appointmentId: 'appt_103',
  },
  {
    id: 'rec_4',
    name: 'Phạm Bảo Ngọc',
    type: 'Khách mới',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    email: 'baongoc.pham@yahoo.com',
    phone: '0975 080 256',
    channel: 'SMS',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_104',
  },
  {
    id: 'rec_5',
    name: 'Nguyễn Khánh Linh',
    type: 'Khách quay lại',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    email: 'khanhlinh.nguyen@gmail.com',
    phone: '0937 730 589',
    channel: 'SMS',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_105',
  },
  {
    id: 'rec_6',
    name: 'Trần Văn Nam',
    type: 'Khách mới',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    email: 'vannam.tran@yahoo.com',
    phone: '0985 568 977',
    channel: 'Email',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_106',
  },
  {
    id: 'rec_7',
    name: 'Vũ Đức Thành',
    type: 'Khách quay lại',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    email: 'ducthanh.vu@hotmail.com',
    phone: '-',
    channel: 'SMS',
    dateTime: '31/10/2024 10:20',
    status: 'Failed',
    errorReason: 'Nhà mạng chặn SMS',
    appointmentId: 'appt_107',
  },
  {
    id: 'rec_8',
    name: 'Hoàng Quốc Việt',
    type: 'Khách quay lại',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    email: 'quocviet.hoang@gmail.com',
    phone: '0918 979 623',
    channel: 'SMS',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_108',
  },
  {
    id: 'rec_9',
    name: 'Bùi Thị Hà',
    type: 'Khách mới',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    email: 'thiha.bui@gmail.com',
    phone: '0969 195 766',
    channel: 'SMS',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_109',
  },
  {
    id: 'rec_10',
    name: 'Đỗ Hải Yến',
    type: 'Khách mới',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
    email: 'haiyen.do@hotmail.com',
    phone: '0921 385 348',
    channel: 'Email',
    dateTime: '31/10/2024 10:20',
    status: 'Delivered',
    appointmentId: 'appt_110',
  }
];

export default function AutomationDetailView({ id = 'appointment-reminder' }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'details'
  const [search, setSearch] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Vietnamese titles map for IDs
  const TITLE_MAP = {
    'appointment-reminder': 'Nhắc lịch hẹn sắp tới',
    'confirmed-appointment': 'Xác nhận lịch hẹn',
    'rescheduled-appointment': 'Đổi lịch hẹn',
    'cancelled-appointment': 'Hủy lịch hẹn',
    'did-not-show-up': 'Khách không đến (No-show)',
    'thank-you-for-visiting': 'Cảm ơn sau dịch vụ',
    'reminder-to-rebook': 'Nhắc đặt lịch lại',
    'celebrate-birthdays': 'Chúc mừng sinh nhật',
    'reward-loyal-clients': 'Tri ân khách hàng thân thiết',
    'welcome-new-clients': 'Chào mừng khách hàng mới',
  };

  const titleFormatted = TITLE_MAP[id] || id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const filteredRecipients = MOCK_RECIPIENTS.filter(rec =>
    rec.name.toLowerCase().includes(search.toLowerCase()) ||
    rec.email.toLowerCase().includes(search.toLowerCase()) ||
    rec.phone.includes(search)
  );

  const handleRowClick = (rec) => {
    // Construct mock appointment details to open AppointmentModal
    setSelectedAppt({
      id: rec.appointmentId,
      customer_name: rec.name,
      customer_phone: rec.phone !== '-' ? rec.phone : '0987654321',
      date: '2024-10-31',
      start_time: '10:20',
      end_time: '11:20',
      services: [
        { service_name: 'Cắt fade nam + Gội chăm sóc', price: 350000, duration_minutes: 60 }
      ],
      price: 350000,
      status: 'confirmed',
      staff_name: 'Vũ Minh Thư',
      facility_name: 'Ghế cắt #2'
    });
    setApptModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full min-h-[750px] bg-slate-50/50 font-body rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header Bar */}
        <div className="px-8 py-6 md:px-10 bg-white border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs space-y-4">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/automations" className="hover:text-blue-600 transition-colors">
              Danh sách kịch bản
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-600 font-semibold">{titleFormatted}</span>
          </div>

          {/* Title Row & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{titleFormatted}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
                  Đang hoạt động
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Gửi thông báo tự động tới khách hàng khi kích hoạt sự kiện</span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">SMS</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">Email</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Actions Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActionsOpen(!actionsOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <span>Thao tác</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {actionsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 font-body">
                  <button
                    onClick={() => { setActionsOpen(false); toast.success('Đã tạm dừng kịch bản'); }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Tạm dừng kịch bản
                  </button>
                  <button
                    onClick={() => { setActionsOpen(false); setEditModalOpen(true); }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Chỉnh sửa kịch bản
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-slate-100 pt-2">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Thống kê hiệu quả
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Thông tin kịch bản
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8 md:p-10 space-y-8 w-full">
          
          {activeTab === 'metrics' ? (
            <>
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                
                {/* 1. Sent */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã gửi</span>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">1,575</div>
                    <div className="text-xs text-slate-400 space-y-1 mt-3 pt-3 border-t border-slate-100">
                      <p className="flex justify-between"><span>Email:</span> <span className="font-semibold text-slate-700">1,400</span></p>
                      <p className="flex justify-between"><span>SMS:</span> <span className="font-semibold text-slate-700">125</span></p>
                      <p className="flex justify-between"><span>WhatsApp:</span> <span className="font-semibold text-slate-700">50</span></p>
                    </div>
                  </div>
                </div>

                {/* 2. Delivered */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã nhận thành công</span>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <MailCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">550</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">(32%)</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1 mt-3 pt-3 border-t border-slate-100">
                      <p className="flex justify-between"><span>Email:</span> <span className="font-semibold text-slate-700">400 (70%)</span></p>
                      <p className="flex justify-between"><span>SMS:</span> <span className="font-semibold text-slate-700">100 (20%)</span></p>
                      <p className="flex justify-between"><span>WhatsApp:</span> <span className="font-semibold text-slate-700">50 (10%)</span></p>
                    </div>
                  </div>
                </div>

                {/* 3. Failed */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gửi thất bại</span>
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">375</span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">(23%)</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1 mt-3 pt-3 border-t border-slate-100">
                      <p className="flex justify-between"><span>Email:</span> <span className="font-semibold text-slate-700">300 (65%)</span></p>
                      <p className="flex justify-between"><span>SMS:</span> <span className="font-semibold text-slate-700">75 (20%)</span></p>
                      <p className="flex justify-between"><span>WhatsApp:</span> <span className="font-semibold text-slate-700">50 (15%)</span></p>
                    </div>
                  </div>
                </div>

                {/* 4. Opened */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã mở xem</span>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <MailOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">125</span>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">(8%)</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1 mt-3 pt-3 border-t border-slate-100">
                      <p className="flex justify-between"><span>Email:</span> <span className="font-semibold text-slate-700">75 (40%)</span></p>
                      <p className="flex justify-between"><span>SMS:</span> <span className="font-semibold text-slate-700">50 (30%)</span></p>
                      <p className="flex justify-between"><span>WhatsApp:</span> <span className="font-semibold text-slate-700">50 (30%)</span></p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Message Recipient List Section */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                
                {/* Search & Filter Header */}
                <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm">Danh sách Nhật ký Gửi tin</h3>

                  <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên khách hàng, số điện thoại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 bg-slate-50/50"
                      />
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs">
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lọc</span>
                    </button>
                  </div>
                </div>

                {/* Recipients Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Khách hàng</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Số điện thoại</th>
                        <th className="py-3 px-4">Kênh gửi</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredRecipients.map((rec) => (
                        <tr
                          key={rec.id}
                          onClick={() => handleRowClick(rec)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Client */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={rec.avatar} name={rec.name} size={36} color="#3B82F6" />
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {rec.name}
                                </div>
                                <span className={`inline-block text-[10px] font-semibold ${
                                  rec.type === 'Khách quay lại' ? 'text-blue-600' : 'text-emerald-600'
                                }`}>
                                  {rec.type}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 text-slate-600 font-medium">{rec.email}</td>

                          {/* Phone */}
                          <td className="py-3 px-4 text-slate-600 font-medium">{rec.phone}</td>

                          {/* Channel */}
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60">
                              {rec.channel}
                            </span>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3 px-4 text-slate-600 font-medium">{rec.dateTime}</td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {rec.status === 'Delivered' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
                                Đã nhận
                              </span>
                            ) : (
                              <div className="relative group/err inline-block">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold border border-rose-200/60">
                                  Thất bại
                                  <Info className="w-3 h-3 text-rose-500" />
                                </span>
                                {/* Error Tooltip Popover */}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover/err:block z-30 bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                  {rec.errorReason || 'Lỗi gửi tin!'}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Action Link to Appointment */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRowClick(rec); }}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1 ml-auto"
                            >
                              <span>Xem lịch</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Hiển thị 1 - 10 trên 1,575 nhật ký</span>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-2xs">
                      1
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
                      2
                    </button>
                    <span className="px-1 text-slate-400">...</span>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
                      9
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
                      10
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </>
          ) : (
            /* Details Tab Content translated to Vietnamese */
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Mã kịch bản</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">AM_00592</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400">Thời gian gửi</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">2 giờ trước, 12 giờ trước</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400">Kênh phát thông báo</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">Email, SMS, WhatsApp</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400">Ngày khởi tạo</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">31/10/2024</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Appointment Details Modal Modal */}
      {apptModalOpen && (
        <AppointmentModal
          open={apptModalOpen}
          onClose={() => setApptModalOpen(false)}
          editing={selectedAppt}
          onSaved={() => toast.success('Đã cập nhật lịch hẹn')}
        />
      )}

      {/* Edit Automation Event Modal */}
      {editModalOpen && (
        <EditEventModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          item={{
            title: titleFormatted,
            description: 'Gửi thông báo tự động tới khách hàng khi kích hoạt sự kiện',
            sendTimes: ['2 giờ trước', '12 giờ trước'],
            channels: ['Email', 'SMS', 'WhatsApp']
          }}
          onSave={() => toast.success('Đã lưu cấu hình kịch bản mới')}
        />
      )}

    </div>
  );
}
