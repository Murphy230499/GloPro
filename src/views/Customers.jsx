'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, X, Phone, Calendar, Gift, Edit3, Crown, Tag, Users, Trash2, ChevronDown, ChevronLeft, ChevronRight, Mail, MapPin, Sparkles, MessageSquare, PlusCircle, User, Check, ShieldCheck, Play, ArrowRight, UserCheck, CalendarDays, MoreHorizontal, Filter, RotateCw, Receipt, RotateCcw, Printer, CreditCard, QrCode, Megaphone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND, formatDate, todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import ImageUpload from '@/components/ImageUpload';
import CustomerGroupManager from '@/components/customers/CustomerGroupManager';
import CustomerTiersTab from '@/components/customers/CustomerTiersTab';
import CustomerSegmentsTab from '@/components/customers/CustomerSegmentsTab';
import LoyaltyPointsTab from '@/components/customers/LoyaltyPointsTab';
import AppointmentModal from '@/components/AppointmentModal';
import POSInvoiceModal from '@/components/POSInvoiceModal';
import { loadCustomerTiers, loadCustomerTierHistory } from '@/utils/loyaltyFallbacks';
import EmptyStateSeeder from '@/components/EmptyStateSeeder';
import { seedCustomerData } from '@/lib/seeders/customerSeeder';

class CustomerDetailErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("CustomerDetail Error Boundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-800 text-left space-y-4">
          <h2 className="text-lg font-bold">Lỗi hiển thị Chi tiết Khách hàng:</h2>
          <p className="text-sm font-mono bg-red-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
            {this.state.error?.stack || this.state.error?.toString()}
          </p>
          <button 
            onClick={() => this.props.onClose()} 
            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-semibold font-sans transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Customers() {


  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [customerTiers, setCustomerTiers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');
  const [creating, setCreating] = useState(false);
  const [groupManagerOpen, setGroupManagerOpen] = useState(false);
  const [tab, setTab] = useState('list'); // 'list', 'tiers', 'segments', 'points'
  const [tierCreateTrigger, setTierCreateTrigger] = useState(0);
  const [segmentCreateTrigger, setSegmentCreateTrigger] = useState(0);


  const handleOpenDetail = (c) => {
    setDetail(c);
  };

  const handleCloseDetail = () => {
    setDetail(null);
  };


  const load = () => {
    Promise.all([
      base44.entities.Customer.list(),
      base44.entities.Invoice.list(),
      base44.entities.Membership.list(),
      base44.entities.CustomerGroup.list().catch(() => {
        const local = localStorage.getItem('glopro_customer_groups');
        try {
          return local && local !== 'undefined' ? JSON.parse(local) : [];
        } catch (e) {
          return [];
        }
      }),
      loadCustomerTiers()
    ]).then(([c, inv, m, g, t]) => {
      const localMappings = localStorage.getItem('glopro_customer_group_mappings');
      let mappings = {};
      try {
        if (localMappings && localMappings !== 'undefined') mappings = JSON.parse(localMappings);
      } catch (err) {}
      
      const enrichedCustomers = c.map(cust => ({
        ...cust,
        group_id: cust.group_id || mappings[cust.id] || ''
      }));

      setCustomers(enrichedCustomers);
      setInvoices(inv);
      setMemberships(m);
      setCustomerGroups(g.length > 0 ? g : (() => {
        const local = localStorage.getItem('glopro_customer_groups');
        try {
          return local && local !== 'undefined' ? JSON.parse(local) : [];
        } catch (e) {
          return [];
        }
      })());
      setCustomerTiers(t);
      setLoading(false);
    }).catch(err => {
      console.error('Lỗi khi tải danh sách khách hàng:', err);
      toast.error('Không thể kết nối máy chủ để tải dữ liệu khách hàng.');
      setLoading(false);
    });
  };
  useEffect(() => {
    load();
    window.addEventListener('reload-data', load);
    return () => window.removeEventListener('reload-data', load);
  }, []);

  const filtered = (customers || []).filter((c) => {
    if (!c) return false;
    const cname = String(c.name || '').toLowerCase();
    const cphone = String(c.phone || '');
    return cname.includes(search.toLowerCase()) || cphone.includes(search);
  });

  const custInvoices = (detail && detail.id) ? (invoices || []).filter((i) => i && String(i.customer_id) === String(detail.id)).sort((a, b) => (b.date || '').localeCompare(a.date || '')) : [];
  const custMemberships = (detail && detail.id) ? (memberships || []).filter((m) => m && String(m.customer_id) === String(detail.id) && !m.is_deleted && m.status !== 'deleted') : [];

  const saveCustomer = async (data) => {
    try {
      const name = `${data.last_name || ''} ${data.first_name || ''}`.trim();
      const payload = {
        name: name || data.name,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        birthday: data.birthday,
        address: data.address,
        note: data.note,
        avatar_url: data.avatar_url,
        group_id: data.group_id,
        first_name: data.first_name,
        last_name: data.last_name,
        client_source: data.client_source,
        notify_email: !!data.notify_email,
        notify_sms: !!data.notify_sms,
        referred_type: data.referred_type,
        referred_id: data.referred_id
      };

      let savedCust;
      if (editing && editing.id) {
        savedCust = await base44.entities.Customer.update(editing.id, payload);
        toast.success('Đã cập nhật');
      } else {
        savedCust = await base44.entities.Customer.create(payload);
        toast.success('Đã thêm khách hàng');
      }

      const targetId = savedCust?.id || editing?.id;
      if (targetId) {
        const localMappings = localStorage.getItem('glopro_customer_group_mappings');
        let mappings = {};
        try {
          if (localMappings && localMappings !== 'undefined') mappings = JSON.parse(localMappings);
        } catch (e) {}
        if (data.group_id) {
          mappings[targetId] = data.group_id;
        } else {
          delete mappings[targetId];
        }
        localStorage.setItem('glopro_customer_group_mappings', JSON.stringify(mappings));
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu khách hàng');
    }
    setEditing(null);
    load();
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này khỏi hệ thống?')) return;
    try {
      await base44.entities.Customer.delete(id);
      toast.success('Đã xóa khách hàng');
      
      const localMappings = localStorage.getItem('glopro_customer_group_mappings');
      if (localMappings) {
        try {
          let mappings = JSON.parse(localMappings);
          delete mappings[id];
          localStorage.setItem('glopro_customer_group_mappings', JSON.stringify(mappings));
        } catch (e) {}
      }
      handleCloseDetail();
      load();
    } catch (e) {
      toast.error('Lỗi khi xóa khách hàng: ' + e.message);
    }
  };

  const handleSeedCustomers = async () => {
    setSeeding(true);
    try {
      const result = await seedCustomerData('all', (msg) => setSeedProgress(msg || ''));
      toast.success(`Đã tạo: ${result.customers} khách hàng, ${result.groups} nhóm`);
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    } finally {
      setSeeding(false);
      setSeedProgress('');
    }
  };


  if (detail) {

    return (
      <>
        <CustomerDetailErrorBoundary onClose={handleCloseDetail}>
          <CustomerDetail 
            customer={detail} 
            customerGroups={customerGroups} 
            customerTiers={customerTiers} 
            invoices={custInvoices} 
            memberships={custMemberships} 
            onClose={handleCloseDetail} 
            onEdit={() => {
              setEditing(detail);
            }} 
            onDelete={handleDeleteCustomer}
            onInvoiceCreated={load}
          />
        </CustomerDetailErrorBoundary>
        {editing && (
          <CustomerForm 
            customer={editing} 
            groups={customerGroups} 
            onClose={() => setEditing(null)} 
            onSave={async (updatedCustomer) => {
              await saveCustomer(updatedCustomer);
              const refreshedDetail = {
                ...updatedCustomer,
                name: `${updatedCustomer.last_name || ''} ${updatedCustomer.first_name || ''}`.trim() || updatedCustomer.name
              };
              setDetail(refreshedDetail);
            }} 
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {tab === 'list' && 'Khách hàng'}
            {tab === 'tiers' && 'Hạng khách hàng'}
            {tab === 'segments' && 'Tập khách hàng'}
            {tab === 'points' && 'Tích điểm'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {tab === 'list' && `${customers.length} khách hàng toàn chuỗi`}
            {tab === 'tiers' && 'Định nghĩa điều kiện lên hạng và quyền lợi giảm giá thành viên.'}
            {tab === 'segments' && 'Bộ lọc tập khách hàng theo các điều kiện hành vi & thông tin.'}
            {tab === 'points' && 'Cấu hình tỷ lệ tích lũy điểm và chính sách reset điểm tích lũy.'}
          </p>
        </div>
        {tab === 'list' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setGroupManagerOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm">
              <Tag className="w-4 h-4 text-slate-400" /> Quản lý nhóm
            </button>
            <button onClick={() => {setEditing({});}} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
              <Plus className="w-4 h-4" /> Thêm khách
            </button>
          </div>
        )}
        {tab === 'tiers' && (
          <button 
            onClick={() => setTierCreateTrigger(prev => prev + 1)} 
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm font-sans"
          >
            <Plus className="w-4 h-4" /> Tạo hạng thành viên
          </button>
        )}
        {tab === 'segments' && (
          <button 
            onClick={() => setSegmentCreateTrigger(prev => prev + 1)} 
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm font-sans"
          >
            <Plus className="w-4 h-4" /> Tạo tập khách hàng
          </button>
        )}
      </div>

      {/* Tabs Menu Bar */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        <button onClick={() => setTab('list')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
            tab === 'list' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Quản lý khách hàng</span>
        </button>
        <button onClick={() => setTab('tiers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
            tab === 'tiers' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Crown className="w-4 h-4 shrink-0" />
          <span>Hạng khách hàng</span>
        </button>
        <button onClick={() => setTab('segments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
            tab === 'segments' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4 shrink-0" />
          <span>Tập khách hàng</span>
        </button>
        <button onClick={() => setTab('points')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
            tab === 'points' 
              ? 'bg-primary text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Gift className="w-4 h-4 shrink-0" />
          <span>Tích điểm</span>
        </button>
      </div>

      {tab === 'list' && (
        <>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc SĐT..." className="bg-transparent outline-none text-sm flex-1" />
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>
          ) : customers.length === 0 ? (
            <EmptyStateSeeder
              icon={<Users className="w-8 h-8 text-pink-400" />}
              title="Chưa có khách hàng nào"
              description="Thêm khách hàng đầu tiên hoặc tạo nhanh 12 khách hàng mẫu để trải nghiệm hệ thống."
              onSeed={handleSeedCustomers}
              seeding={seeding}
              seedProgress={seedProgress}
              onAdd={() => setEditing({})}
              addLabel="Thêm khách hàng"
              seedLabel="Tạo 12 khách hàng mẫu"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(filtered || []).map((c) => {
                const isVIP = (c && c.total_spent || 0) > 5000000;
                const custGroup = (customerGroups || []).find(g => g && g.id === c.group_id);
                // Find eligible tier
                const sortedTiers = [...(customerTiers || [])].filter(Boolean).sort((a, b) => ((b && b.min_spend) || 0) - ((a && a.min_spend) || 0));
                const tier = sortedTiers.find(t => t && ((c.total_spent || 0) >= t.min_spend || (c.points || 0) >= t.min_points));

                return (
                  <div key={c.id} className="relative text-left rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-[hsl(var(--secondary))] flex flex-col justify-between">
                    {custGroup && (
                      <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full text-white font-bold z-10" style={{ backgroundColor: custGroup.color }}>
                        {custGroup.name}
                      </span>
                    )}
                    
                    {/* Clickable Card Body Area */}
                    <div onClick={() => handleOpenDetail(c)} className="cursor-pointer space-y-3 flex-grow">
                      <div className="flex items-center gap-3">
                        <Avatar src={c.avatar_url} name={c.name} size={48} color="#E879A9" />
                        <div className="flex-1 min-w-0 pr-12">
                          <div className="font-bold truncate flex items-center gap-1.5 flex-wrap">
                            {c.name} 
                            {isVIP && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                            {tier && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md text-white font-bold inline-block" style={{ backgroundColor: tier.color }}>
                                {tier.name}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 text-center">
                        <div><div className="font-bold text-sm">{c.visit_count || 0}</div><div className="text-[10px] text-slate-400">lần đến</div></div>
                        <div><div className="font-bold text-sm">{c.points || 0}</div><div className="text-[10px] text-slate-400">điểm</div></div>
                        <div><div className="font-bold text-sm text-pink-600">{formatVND(c.total_spent || 0).replace('₫', '')}</div><div className="text-[10px] text-slate-400">VNĐ</div></div>
                      </div>
                    </div>

                    {/* Bottom toolbar for edit & delete */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 shrink-0">
                      <button onClick={() => handleOpenDetail(c)} className="text-[10px] text-primary font-bold hover:underline">
                        Xem chi tiết &rarr;
                      </button>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditing(c); }} 
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
                          title="Sửa thông tin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id); }} 
                          className="p-1.5 text-red-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'tiers' && <CustomerTiersTab onChanged={load} createTrigger={tierCreateTrigger} />}
      {tab === 'segments' && <CustomerSegmentsTab createTrigger={segmentCreateTrigger} />}
      {tab === 'points' && <LoyaltyPointsTab onChanged={load} />}

      {editing && <CustomerForm customer={editing} groups={customerGroups} onClose={() => setEditing(null)} onSave={saveCustomer} />}
      {groupManagerOpen && (
        <CustomerGroupManager 
          branchId="all" 
          onClose={() => setGroupManagerOpen(false)} 
          onChanged={load} 
        />
      )}
    </div>);

}

const formatAppointmentId = (id) => {
  if (!id) return 'SC_000000';
  const idStr = String(id);
  if (idStr.startsWith('SC_')) return idStr;
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const positiveHash = Math.abs(hash) % 1000000;
  return `SC_${String(positiveHash).padStart(6, '0')}`;
};

function CustomerDetail({ customer, customerGroups = [], customerTiers = [], invoices = [], memberships = [], onClose, onEdit, onDelete, onInvoiceCreated }) {
  const router = useRouter();
  const custGroup = customer ? (customerGroups || []).find(g => g && g.id === customer.group_id) : null;
  const sortedTiers = [...(customerTiers || [])].sort((a, b) => ((b && b.min_spend) || 0) - ((a && a.min_spend) || 0));
  const tier = customer ? sortedTiers.find(t => t && ((customer.total_spent || 0) >= t.min_spend || (customer.points || 0) >= t.min_points)) : null;

  const [tierHistory, setTierHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [searchAppt, setSearchAppt] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);

  // Purchased items search filter
  const [purchasedSearch, setPurchasedSearch] = useState('');

  // Bulk booking state variables
  const [bulkBookingOpen, setBulkBookingOpen] = useState(false);
  const [bulkBookingType, setBulkBookingType] = useState('cycle'); // 'cycle' | 'custom'
  const [bulkBookingStartDate, setBulkBookingStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bulkBookingStartTime, setBulkBookingStartTime] = useState('09:00');
  const [bulkBookingInterval, setBulkBookingInterval] = useState(10);
  const [bulkBookingIntervalType, setBulkBookingIntervalType] = useState('day'); // 'day' | 'week' | 'month'
  const [bulkBookingSessionsCount, setBulkBookingSessionsCount] = useState(1);
  const [bulkBookingCustomDates, setBulkBookingCustomDates] = useState([{ date: '', start_time: '09:00' }]);
  const [bulkBookingStaffId, setBulkBookingStaffId] = useState('');
  const [bulkBookingStaffName, setBulkBookingStaffName] = useState('');
  const [bulkBookingLoading, setBulkBookingLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState(() => {
    if (customer && typeof customer.note === 'string') {
      return customer.note.split('\n').filter(Boolean);
    }
    return [];
  });
  
  // Accordion toggle states
  const [personalOpen, setPersonalOpen] = useState(true);
  const [packagesOpen, setPackagesOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);

  // Pagination for Appointments
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // New states for Filter, Details Popup, Actions dropdown, and booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [selectedApptDetail, setSelectedApptDetail] = useState(null);
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [posModalInitialCart, setPosModalInitialCart] = useState([]);

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterStaff, setFilterStaff] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Invoice tab filters and print states
  const [invStartDate, setInvStartDate] = useState('');
  const [invEndDate, setInvEndDate] = useState('');
  const [invSearch, setInvSearch] = useState('');
  const [invFilterOpen, setInvFilterOpen] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [isDraftPrint, setIsDraftPrint] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [extendingExpiry, setExtendingExpiry] = useState(false);
  const [newExpiryInput, setNewExpiryInput] = useState('');

  const getLastUsageDate = (membership) => {
    if (!membership || membership.type === 'cash_card') return null;
    const usageInvs = (invoices || []).filter(inv => 
      inv && inv.status === 'paid' && 
      (inv.items || []).some(item => item && item.name === membership.name && item.price === 0) &&
      inv.date
    );
    if (usageInvs.length === 0) return null;
    const sorted = [...usageInvs].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return sorted[0].date;
  };

  const getMembershipHistory = (membership) => {
    if (!membership) return [];
    
    // 1. Purchase invoice
    const purchaseInvoices = (invoices || []).filter(inv => 
      inv && inv.status === 'paid' && 
      (inv.items || []).some(item => item && item.name === membership.name && item.price > 0)
    ).map(inv => {
      const item = (inv.items || []).find(x => x && x.name === membership.name);
      return {
        id: inv.id,
        invoice_code: inv.invoice_code,
        date: inv.date,
        type: 'purchase',
        amount: item ? (Number(item.price) || 0) * (Number(item.qty) || 1) : 0,
        description: `Mua ${membership.type === 'cash_card' ? 'thẻ tiền mặt' : membership.type === 'package' ? 'gói dịch vụ' : 'liệu trình'}`
      };
    });

    // 2. Usage invoices
    let usageInvoices = [];
    if (membership.type === 'cash_card') {
      usageInvoices = (invoices || []).filter(inv => 
        inv && inv.status === 'paid' && 
        (inv.payment_methods || []).some(pm => pm && (pm.method === 'membership' || pm.method === 'cash_card')) &&
        !purchaseInvoices.some(p => p.id === inv.id)
      ).map(inv => {
        const pm = (inv.payment_methods || []).find(x => x && (x.method === 'membership' || x.method === 'cash_card'));
        return {
          id: inv.id,
          invoice_code: inv.invoice_code,
          date: inv.date,
          type: 'usage',
          amount: pm ? (Number(pm.amount) || 0) : 0,
          description: 'Thanh toán hoá đơn'
        };
      });
    } else {
      usageInvoices = (invoices || []).filter(inv => 
        inv && inv.status === 'paid' && 
        (inv.items || []).some(item => item && item.name === membership.name && item.price === 0)
      ).map(inv => {
        const item = (inv.items || []).find(x => x && x.name === membership.name);
        return {
          id: inv.id,
          invoice_code: inv.invoice_code,
          date: inv.date,
          type: 'usage',
          amount: item ? (Number(item.qty) || 1) : 1,
          description: `Sử dụng dịch vụ combo (${item ? (Number(item.qty) || 1) : 1} buổi)`
        };
      });
    }

    return [...purchaseInvoices, ...usageInvoices].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  };

  const renderMembershipCard = (m) => {
    const isCashCard = m.type === 'cash_card';
    const isPackage = m.type === 'package';
    
    // Resolve card color with smart name-based fallbacks for legacy/seed data
    let cardColor = m.color;
    if (!cardColor) {
      const nameLower = (m.name || '').toLowerCase();
      if (nameLower.includes('luxury') || nameLower.includes('vàng') || nameLower.includes('gold')) {
        cardColor = '#F59E0B'; // Luxury / Gold / Yellow
      } else if (nameLower.includes('premium') || nameLower.includes('đen') || nameLower.includes('black') || nameLower.includes('vip black')) {
        cardColor = '#1E293B'; // Premium / Black
      } else if (nameLower.includes('vip') || nameLower.includes('hồng') || nameLower.includes('pink')) {
        cardColor = '#FF6B9D'; // VIP / Pink
      } else {
        cardColor = isCashCard ? '#FF6B9D' : isPackage ? '#3B82F6' : '#10B981';
      }
    }

    // Determine status
    const isCompleted = m.type !== 'cash_card' && m.sessions_remaining <= 0;
    const isExpired = !isCompleted && m.expiry_date && new Date(m.expiry_date) < new Date();
    
    let statusText = 'Đang sử dụng';
    if (!m.is_active) {
      statusText = 'Đang bảo lưu';
    } else if (isCompleted) {
      statusText = 'Đã hoàn thành';
    } else if (isExpired) {
      statusText = 'Đã hết hạn';
    }
    
    return (
      <div 
        key={m.id} 
        onClick={() => setSelectedMembership(m)}
        className="relative p-5 rounded-3xl overflow-hidden text-white shadow-md hover:shadow-xl cursor-pointer transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between aspect-[1.58/1] min-h-[170px] select-none group border border-white/10"
        style={{ backgroundColor: cardColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/20 opacity-90 transition-opacity group-hover:opacity-100" />
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 blur-xl group-hover:bg-white/10 transition-colors" />
  
        <div className="flex justify-between items-start w-full relative z-10">
          <div className="space-y-0.5 max-w-[70%] text-left">
            <span className="text-[8px] text-white/70 font-bold uppercase tracking-wider block">GLOPRO MEMBER</span>
            <div className="font-extrabold text-sm md:text-base tracking-tight truncate leading-tight">{m.name}</div>
          </div>
          <div className="w-8 h-6 rounded-md bg-gradient-to-r from-amber-400 to-amber-250 opacity-80 flex flex-col justify-around p-1 shadow-inner shrink-0">
            <div className="grid grid-cols-3 gap-px h-full">
              <div className="border-[0.5px] border-amber-600/30 rounded-2xs" />
              <div className="border-[0.5px] border-amber-600/30 rounded-2xs" />
              <div className="border-[0.5px] border-amber-600/30 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Display activation and expiry dates for package/treatment cards */}
        {!isCashCard && (() => {
          const lastUsageDate = getLastUsageDate(m);
          return (
            <div className="text-[9px] text-white/80 space-y-0.5 relative z-10 text-left my-2 font-medium">
              <div>Kích hoạt: {formatDate(m.purchased_date || m.date_purchased || '')}</div>
              <div>Hết hạn: {m.expiry_date ? formatDate(m.expiry_date) : 'Vô thời hạn'}</div>
              <div>Đến gần nhất: {lastUsageDate ? formatDate(lastUsageDate) : 'Chưa sử dụng'}</div>
            </div>
          );
        })()}
  
        <div className="relative z-10 flex justify-between items-end w-full mt-auto gap-2">
          <div className="space-y-0.5 text-left min-w-0 flex-1">
            <span className="text-[8px] text-white/70 font-medium uppercase tracking-wider block whitespace-nowrap">
              {isCashCard ? 'Số dư thẻ' : 'Hạn mức sử dụng'}
            </span>
            <span className="font-black text-xs md:text-sm tracking-wider block whitespace-nowrap">
              {isCashCard ? formatVND(m.balance) : `Đã dùng ${m.total_sessions - m.sessions_remaining}/${m.total_sessions} buổi`}
            </span>
          </div>
          <span className={`text-[8px] px-2 py-0.5 rounded-full backdrop-blur-xs text-white border border-white/15 font-bold uppercase tracking-wider whitespace-nowrap shrink-0 ${
            statusText === 'Đang bảo lưu' ? 'bg-amber-500/40' : 
            statusText === 'Đã hết hạn' ? 'bg-rose-500/40' : 
            statusText === 'Đã hoàn thành' ? 'bg-blue-500/40' : 
            'bg-emerald-500/40'
          }`}>
            {statusText}
          </span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadCustomerTierHistory().then((data) => {
      if (Array.isArray(data)) {
        setTierHistory(data.filter(h => h && String(h.customer_id) === String(customer.id)));
      } else {
        setTierHistory([]);
      }
    }).catch(err => {
      console.error('Lỗi khi tải lịch sử hạng:', err);
      setTierHistory([]);
    });
    // Load staff and services for filters
    base44.entities.Staff.filter({ is_active: true }).then(setStaffList).catch(() => []);
    base44.entities.Service.filter({ is_active: true }).then(setServicesList).catch(() => []);
  }, [customer.id]);

  const loadAppointments = () => {
    setLoadingAppts(true);
    try {
      base44.entities.Appointment.filter({ customer_id: customer.id || '' })
        .then((data) => {
          const sorted = (data || []).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          if (sorted.length === 0) {
            // Generous mock data matching the screenshot style and layout
            const mockAppts = [
              { id: 'SC_000551', staff_id: '', staff_name: 'Pedro Robel', date: '2024-10-31', time: '11:13 AM', service_name: 'Cắt tóc nam, Gội đầu dưỡng sinh', status: 'completed', price: 463000 },
              { id: 'SC_000188', staff_id: '', staff_name: 'Muriel Keebler', date: '2024-10-31', time: '08:33 AM', service_name: 'Chăm sóc da mặt chuyên sâu', status: 'completed', price: 381000 },
              { id: 'SC_000383', staff_id: '', staff_name: 'Muriel Keebler', date: '2024-10-30', time: '01:27 PM', service_name: 'Massage body đá nóng', status: 'checked_in', price: 50000 },
              { id: 'SC_000862', staff_id: '', staff_name: 'Francis Lynch', date: '2024-10-28', time: '06:16 AM', service_name: 'Cắt tóc tạo kiểu VIP', status: 'booked', price: 818000 },
              { id: 'SC_000609', staff_id: '', staff_name: 'Erick Johns', date: '2024-10-27', time: '04:36 AM', service_name: 'Trị mụn laser công nghệ cao', status: 'no_show', price: 708000 },
              { id: 'SC_000468', staff_id: '', staff_name: 'Erick Johns', date: '2024-10-27', time: '09:13 AM', service_name: 'Nail Art cao cấp', status: 'cancelled', price: 642000 },
              { id: 'SC_000882', staff_id: '', staff_name: 'Judy Zemlak', date: '2024-10-26', time: '06:51 AM', service_name: 'Uốn tóc phục hồi collagen', status: 'confirmed', price: 729000 }
            ];
            setAppointments(mockAppts);
          } else {
            setAppointments(sorted.filter(Boolean).map((a, i) => ({
              id: a.id || `SC_000${100 + i}`,
              staff_id: a.staff_id || '',
              staff_name: a.staff_name || 'Nhân viên',
              date: a.date || new Date().toISOString().split('T')[0],
              time: a.time || '10:00 AM',
              service_name: a.service_name || 'Dịch vụ spa',
              status: a.status || 'booked',
              price: a.price || 150000,
              note: a.note || ''
            })));
          }
          setLoadingAppts(false);
        })
        .catch((err) => {
          console.error("Lỗi khi tải lịch hẹn:", err);
          setLoadingAppts(false);
        });
    } catch (e) {
      console.error("Lỗi đồng bộ khi tải lịch hẹn:", e);
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [customer.id]);

  useEffect(() => {
    setNotes(customer && typeof customer.note === 'string' ? customer.note.split('\n').filter(Boolean) : []);
  }, [customer]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const updatedNotes = [noteText.trim(), ...notes];
      const combinedNote = updatedNotes.join('\n');
      await base44.entities.Customer.update(customer.id, { note: combinedNote });
      setNotes(updatedNotes);
      setNoteText('');
      toast.success('Đã thêm ghi chú thành công');
    } catch (e) {
      toast.error('Lỗi khi thêm ghi chú: ' + e.message);
    }
  };

  const generatePreviewDates = () => {
    if (bulkBookingType === 'cycle') {
      if (!bulkBookingStartDate || !bulkBookingStartTime || bulkBookingSessionsCount <= 0) return [];
      const list = [];
      const start = new Date(bulkBookingStartDate);
      for (let i = 0; i < bulkBookingSessionsCount; i++) {
        const current = new Date(start);
        if (bulkBookingIntervalType === 'day') {
          current.setDate(start.getDate() + i * bulkBookingInterval);
        } else if (bulkBookingIntervalType === 'week') {
          current.setDate(start.getDate() + i * bulkBookingInterval * 7);
        } else if (bulkBookingIntervalType === 'month') {
          current.setMonth(start.getMonth() + i * bulkBookingInterval);
        }
        list.push({
          date: current.toISOString().slice(0, 10),
          start_time: bulkBookingStartTime
        });
      }
      return list;
    } else {
      return bulkBookingCustomDates.filter(x => x && x.date);
    }
  };

  const handleConfirmBulkBooking = async () => {
    const list = generatePreviewDates();
    if (list.length === 0) return;
    
    if (list.length > selectedMembership.sessions_remaining) {
      return toast.error(`Số lượng buổi hẹn vượt quá số buổi còn lại của thẻ (${selectedMembership.sessions_remaining} buổi).`);
    }

    setBulkBookingLoading(true);
    try {
      const serviceObj = servicesList.find(x => x && x.name === selectedMembership.name) || {};
      const duration = serviceObj.duration_minutes || 60;

      const promises = list.map(item => {
        const end = new Date(`2000-01-01T${item.start_time}:00`);
        end.setMinutes(end.getMinutes() + duration);
        const endTimeStr = end.toTimeString().slice(0, 5);

        const payload = {
          customer_id: customer.id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          branch_id: customer.branch_id || 'all',
          service_name: selectedMembership.name,
          price: 0,
          date: item.date,
          start_time: item.start_time,
          end_time: endTimeStr,
          status: 'confirmed',
          source: 'reception',
          note: `Đặt lịch hàng loạt từ thẻ: ${selectedMembership.name}`,
          services: [{
            service_id: serviceObj.id || '',
            service_name: selectedMembership.name,
            price: 0,
            duration_minutes: duration,
            staff_id: bulkBookingStaffId || '',
            staff_name: bulkBookingStaffName || ''
          }]
        };

        if (bulkBookingStaffId) {
          payload.staff_id = bulkBookingStaffId;
          payload.staff_name = bulkBookingStaffName;
        }

        return base44.entities.Appointment.create(payload);
      });

      await Promise.all(promises);
      toast.success(`Đã tự động lên lịch thành công ${list.length} buổi hẹn!`);
      
      setBulkBookingOpen(false);
      setBulkBookingCustomDates([{ date: '', start_time: '09:00' }]);
      setSelectedMembership(null);
      
      load();
      if (onInvoiceCreated) onInvoiceCreated();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi đặt lịch hàng loạt: ' + (e.message || e));
    } finally {
      setBulkBookingLoading(false);
    }
  };

  const handleCloseMembershipModal = () => {
    setSelectedMembership(null);
    setExtendingExpiry(false);
    setNewExpiryInput('');
    setBulkBookingOpen(false);
    setBulkBookingCustomDates([{ date: '', start_time: '09:00' }]);
    setBulkBookingStaffId('');
    setBulkBookingStaffName('');
  };

  const handleBuyAgain = (item) => {
    router.push(`/pos?buy_again_customer_id=${customer.id}&buy_again_name=${encodeURIComponent(item.name)}&buy_again_type=${item.type}&buy_again_price=${item.price}`);
  };

  const handleBookNow = () => {
    setEditingAppt(null);
    setBookingModalOpen(true);
  };

  const handleRebook = (appt) => {
    setEditingAppt({
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      service_id: appt.service_id,
      service_name: appt.service_name,
      price: appt.price,
      staff_id: appt.staff_id,
      staff_name: appt.staff_name,
      services: appt.services || []
    });
    setBookingModalOpen(true);
    setActiveActionId(null);
  };

  const createUnpaidInvoiceFromAppointment = async (appt) => {
    try {
      const list = await base44.entities.Invoice.list();
      const exists = list.some(inv => (inv.customer_id === appt.customer_id && inv.status === 'unpaid' && inv.items.some(x => x.name === appt.service_name)));
      if (exists) return;

      const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
      
      const items = [];
      if (appt.services && appt.services.length) {
        appt.services.forEach(s => {
          items.push({
            name: s.service_name || s.name || appt.service_name,
            type: 'service',
            price: s.price || appt.price || 0,
            qty: 1,
            staff_id: s.staff_id || appt.staff_id || '',
            staff_name: s.staff_name || appt.staff_name || ''
          });
        });
      } else {
        items.push({
          name: appt.service_name,
          type: 'service',
          price: appt.price || 0,
          qty: 1,
          staff_id: appt.staff_id || '',
          staff_name: appt.staff_name || ''
        });
      }

      const subtotal = items.reduce((sum, i) => sum + i.price, 0);

      await base44.entities.Invoice.create({
        invoice_code: saleCode,
        customer_name: appt.customer_name || 'Khách vãng lai',
        customer_id: appt.customer_id || '',
        branch_id: appt.branch_id || '',
        items,
        subtotal,
        discount: 0,
        total: subtotal,
        tip: 0,
        status: 'unpaid',
        date: todayStr()
      });
      toast.success(`Đã tự động đẩy đơn treo sang POS • ${saleCode}`);
    } catch (e) {
      console.error('Lỗi khi tự động tạo hóa đơn treo:', e);
    }
  };

  const handleUpdateApptStatus = async (appt, newStatus) => {
    try {
      const apptIdStr = String(appt.id || '');
      if (apptIdStr.startsWith('SC_')) {
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: newStatus } : a));
        toast.success(`Đã chuyển trạng thái: ${statusMap[newStatus]?.label || newStatus}`);
      } else {
        await base44.entities.Appointment.update(appt.id, { status: newStatus });
        toast.success(`Đã chuyển trạng thái: ${statusMap[newStatus]?.label || newStatus}`);
        loadAppointments();
      }
      
      if (newStatus === 'checked_in') {
        await createUnpaidInvoiceFromAppointment(appt);
      }

      if (newStatus === 'completed') {
        const initialCart = [];
        if (appt.services && appt.services.length) {
          appt.services.forEach(s => {
            initialCart.push({
              name: s.service_name || s.name || appt.service_name,
              price: s.price || appt.price || 0,
              type: 'service',
              staff_id: s.staff_id || appt.staff_id || '',
              staff_name: s.staff_name || appt.staff_name || ''
            });
          });
        } else {
          initialCart.push({
            name: appt.service_name,
            price: appt.price || 0,
            type: 'service',
            staff_id: appt.staff_id || '',
            staff_name: appt.staff_name || ''
          });
        }
        setPosModalInitialCart(initialCart);
        setPosModalOpen(true);
      }

      setActiveActionId(null);
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + e.message);
    }
  };

  const cancelInvoicePayment = async (inv) => {
    if (!confirm(`Bạn có chắc muốn huỷ thanh toán cho hoá đơn ${inv.invoice_code}? Hoá đơn sẽ trở về trạng thái chưa thanh toán và có thể chỉnh sửa.`)) return;
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'unpaid' });
      toast.success('Đã chuyển hóa đơn thành Chưa thanh toán. Đang chuyển hướng...');
      router.push(`/pos?edit_invoice_id=${inv.id}`);
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const deleteCustInvoice = async (inv) => {
    if (!confirm(`Bạn có chắc muốn xoá hoá đơn ${inv.invoice_code}?`)) return;
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'cancelled', previous_status: inv.status });
      
      // Update associated memberships to deleted status
      try {
        const relatedMems = await base44.entities.Membership.filter({ invoice_id: inv.id });
        for (const m of relatedMems) {
          await base44.entities.Membership.update(m.id, { is_deleted: true, status: 'deleted' });
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái thẻ mua kèm hoá đơn:', err);
      }

      toast.success('Đã huỷ/xoá hoá đơn');
      if (onInvoiceCreated) onInvoiceCreated();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const handleDeleteAppt = async (apptId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này khỏi hệ thống?')) return;
    try {
      const apptIdStr = String(apptId || '');
      if (apptIdStr.startsWith('SC_')) {
        setAppointments(prev => prev.filter(a => a.id !== apptId));
        toast.success('Đã xóa lịch hẹn (mô phỏng)');
      } else {
        await base44.entities.Appointment.delete(apptId);
        toast.success('Đã xóa lịch hẹn');
        loadAppointments();
      }
    } catch (e) {
      toast.error('Lỗi khi xóa lịch hẹn: ' + e.message);
    }
  };

  // Filtered Appointments
  const filteredAppts = (appointments || []).filter(a => {
    if (!a) return false;
    const aid = String(a.id || '');
    const astaff = String(a.staff_name || '');
    const aserv = String(a.service_name || '');

    const matchesSearch = 
      aid.toLowerCase().includes(searchAppt.toLowerCase()) ||
      astaff.toLowerCase().includes(searchAppt.toLowerCase()) ||
      aserv.toLowerCase().includes(searchAppt.toLowerCase());
      
    const matchesStaff = !filterStaff || astaff.toLowerCase().includes(filterStaff.toLowerCase());
    const matchesService = !filterService || aserv.toLowerCase().includes(filterService.toLowerCase());
    const matchesStatus = !filterStatus || a.status === filterStatus;
    
    let matchesDate = true;
    if (filterStartDate) {
      matchesDate = matchesDate && (a.date >= filterStartDate);
    }
    if (filterEndDate) {
      matchesDate = matchesDate && (a.date <= filterEndDate);
    }

    return matchesSearch && matchesStaff && matchesService && matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAppts.length / itemsPerPage);
  const paginatedAppts = filteredAppts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusMap = {
    completed: { label: 'Đã hoàn thành', bg: 'bg-green-50 text-green-600 border-green-100' },
    checked_in: { label: 'Đã check-in', bg: 'bg-blue-50 text-blue-600 border-blue-100' },
    booked: { label: 'Đã đặt', bg: 'bg-amber-50 text-amber-600 border-amber-100' },
    no_show: { label: 'Không đến', bg: 'bg-rose-50 text-rose-600 border-rose-100' },
    cancelled: { label: 'Đã hủy', bg: 'bg-slate-100 text-slate-500 border-slate-200' },
    confirmed: { label: 'Đã xác nhận', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  };

  const filteredInvoices = (invoices || []).filter(inv => {
    // Only show paid invoices
    if (inv.status !== 'paid') return false;

    // Search query filter (matches items or code)
    if (invSearch.trim()) {
      const q = invSearch.toLowerCase();
      const codeMatch = (inv.invoice_code || '').toLowerCase().includes(q);
      const itemsMatch = (inv.items || []).some(item => item.name?.toLowerCase().includes(q));
      if (!codeMatch && !itemsMatch) return false;
    }

    // Date range filter
    if (invStartDate && inv.date && inv.date < invStartDate) return false;
    if (invEndDate && inv.date && inv.date > invEndDate) return false;

    return true;
  });

  const allPurchasedItems = [];
  (invoices || []).filter(inv => inv && inv.status === 'paid').forEach(inv => {
    (inv.items || []).forEach(item => {
      allPurchasedItems.push({
        ...item,
        invoice_id: inv.id,
        invoice_code: inv.invoice_code,
        date: inv.date
      });
    });
  });

  const getFilteredItems = (typeFilter, isComboProduct = false) => {
    return allPurchasedItems.filter(item => {
      // Search filter
      if (purchasedSearch.trim()) {
        const q = purchasedSearch.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(q);
        const codeMatch = (item.invoice_code || '').toLowerCase().includes(q);
        const staffMatch = (item.staff_name || '').toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !staffMatch) return false;
      }
      
      // Type filter
      if (typeFilter === 'service') {
        return item.type === 'service';
      }
      if (typeFilter === 'product') {
        return item.type === 'product';
      }
      if (typeFilter === 'package') {
        if (item.type !== 'package') return false;
        const nameLower = (item.name || '').toLowerCase();
        const matchesProductWords = nameLower.includes('sản phẩm') || nameLower.includes('mỹ phẩm') || nameLower.includes('kem') || nameLower.includes('chai') || nameLower.includes('hộp');
        return isComboProduct ? matchesProductWords : !matchesProductWords;
      }
      return true;
    });
  };

  const renderPurchasedTable = (items, title, noDataText) => {
    return (
      <div className="space-y-4 text-left animate-in fade-in duration-200">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <h4 className="font-semibold text-sm text-slate-800">{title} ({items.length})</h4>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={purchasedSearch} 
                onChange={(e) => setPurchasedSearch(e.target.value)} 
                placeholder="Tìm tên, mã HĐ, nhân viên..." 
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none w-48 font-normal font-sans"
              />
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-10 font-normal font-sans">{noDataText}</p>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 font-sans font-bold">
                <tr>
                  <th className="px-4 py-3">Mã HĐ</th>
                  <th className="px-4 py-3">Mặt hàng</th>
                  <th className="px-4 py-3">Ngày mua</th>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3 text-right">Đơn giá</th>
                  <th className="px-4 py-3 text-center">Số lượng</th>
                  <th className="px-4 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-655 font-normal font-sans">
                {items.map((item, idx) => {
                  const dbStaff = (staffList || []).find(s => s && (s.name === item.staff_name || s.id === item.staff_id));

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-primary">
                        <button 
                          onClick={() => {
                            handleCloseMembershipModal();
                            router.push(`/invoices/${item.invoice_id}`);
                          }} 
                          className="hover:underline text-left font-bold"
                        >
                          {item.invoice_code || '—'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-[200px] truncate">
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-normal">
                          <Avatar src={dbStaff?.avatar_url} name={item.staff_name || 'Nhân viên'} size={20} color={dbStaff?.avatar_color || '#FF6B9D'} />
                          <span className="truncate max-w-[120px]" title={item.staff_name}>{item.staff_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-right text-slate-700">
                        {formatVND(item.price)}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {item.qty || 1}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleBuyAgain(item)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-primary hover:bg-pink-50 hover:border-pink-100 transition-colors mx-auto relative group"
                          title="Mua lại"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm font-sans z-20">
                            Mua lại
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const tabsList = [
    { id: 'activity', label: 'Hoạt động' },
    { id: 'appointments', label: 'Lịch hẹn' },
    { id: 'sales', label: 'Hóa đơn' },
    { id: 'purchased_services', label: 'Dịch vụ' },
    { id: 'purchased_products', label: 'Sản phẩm' },
    { id: 'purchased_service_combos', label: 'Combo dịch vụ' },
    { id: 'purchased_product_combos', label: 'Combo sản phẩm' },
    { id: 'cash_cards', label: 'Thẻ tiền mặt' },
    { id: 'packages', label: 'Gói dịch vụ' },
    { id: 'treatments', label: 'Liệu trình' },
    { id: 'notes', label: 'Ghi chú' },
    { id: 'promotions', label: 'Khuyến mãi' },
    { id: 'messages', label: 'Tin nhắn' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Breadcrumbs Path */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <button onClick={onClose} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Quản lý khách hàng
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Chi tiết khách hàng</span>
        </div>

        {/* Actions & Book Appointment Buttons */}
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setActionsOpen(!actionsOpen)} 
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Thao tác <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {actionsOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setActionsOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-100 shadow-xl rounded-2xl py-1 z-40 text-left">
                  <button 
                    onClick={() => { onEdit(); setActionsOpen(false); }} 
                    className="w-full px-4 py-2.5 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Sửa thông tin khách
                  </button>
                  <button 
                    onClick={() => { onDelete(customer.id); setActionsOpen(false); }} 
                    className="w-full px-4 py-2.5 hover:bg-slate-50 text-xs font-medium text-red-650 flex items-center gap-2 border-t border-slate-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /> Xóa khách hàng
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={handleBookNow} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 animate-in fade-in duration-200">
            <CalendarDays className="w-3.5 h-3.5" /> Đặt lịch ngay
          </button>

          <button onClick={() => { setPosModalInitialCart([]); setPosModalOpen(true); }} className="px-4 py-2 bg-pink-50 text-primary border border-pink-100 rounded-xl text-xs font-semibold shadow-xs hover:bg-pink-100/50 transition-all flex items-center gap-1.5 animate-in fade-in duration-200">
            <Receipt className="w-3.5 h-3.5" /> Tạo hóa đơn
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-left">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-800">Chi tiết khách hàng</h2>
      </div>

      {/* Full Width Layout Container */}
      <div className="space-y-4">
        
        {/* Hero Profile Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-5">
            <div className="flex items-center gap-4 text-left w-full md:w-auto">
              <Avatar src={customer.avatar_url} name={customer.name} size={64} color="#E879A9" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg text-slate-800">{customer.name}</h3>
                  {tier && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: tier.color }}>
                      Hạng: {tier.name}
                    </span>
                  )}
                  {custGroup && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-55 bg-slate-100 text-slate-600 font-medium border border-slate-200">
                      Nhóm: {custGroup.name}
                    </span>
                  )}
                  {invoices.length > 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">
                      Khách hàng cũ
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-650 border border-blue-100 font-medium">
                      Khách hàng mới
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-slate-400" /> Truy cập lần cuối: {customer.birthday ? formatDate(customer.birthday) : 'Hôm nay'}
                </div>
              </div>
            </div>

            {/* Micro Stats Columns */}
            <div className="grid grid-cols-3 gap-6 md:gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 pl-0 md:pl-8 w-full md:w-auto text-center md:text-left">
              <div>
                <div className="text-2xl font-semibold text-slate-700">{customer.visit_count || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Lịch hẹn</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-700">{customer.points || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Tích điểm</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-pink-600">
                  {formatVND(invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)).replace('₫', '')}
                </div>
                <div className="text-xs text-slate-400 mt-1">Chi tiêu (đ)</div>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-xs">
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {tabsList.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Tab Panels */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm min-h-[350px]">
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="space-y-0.5 text-left">
                    <h4 className="font-semibold text-sm text-slate-800">Danh sách lịch hẹn</h4>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Tổng số lịch hẹn đã đặt: <span className="font-semibold text-slate-650">{appointments.length}</span> | Điểm tích lũy hiện tại: <span className="font-semibold text-pink-650">{customer.points || 0} điểm</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-60">
                      <input 
                        type="text" 
                        placeholder="Tìm theo mã, KTV, dịch vụ..." 
                        value={searchAppt}
                        onChange={(e) => { setSearchAppt(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary text-slate-700"
                      />
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <button 
                      onClick={() => setFilterPanelOpen(!filterPanelOpen)} 
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all ${filterPanelOpen ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-650 bg-white hover:bg-slate-50'}`}
                    >
                      <Filter className="w-3.5 h-3.5" /> Lọc
                    </button>
                  </div>
                </div>

                {/* Expanded Filters Panel */}
                {filterPanelOpen && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-left animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Nhân viên (KTV)</label>
                      <select 
                        value={filterStaff}
                        onChange={(e) => { setFilterStaff(e.target.value); setCurrentPage(1); }}
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-primary outline-none"
                      >
                        <option value="">Tất cả nhân viên</option>
                        {(staffList || []).filter(Boolean).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Dịch vụ</label>
                      <select 
                        value={filterService}
                        onChange={(e) => { setFilterService(e.target.value); setCurrentPage(1); }}
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-primary outline-none"
                      >
                        <option value="">Tất cả dịch vụ</option>
                        {(servicesList || []).filter(Boolean).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Trạng thái</label>
                      <select 
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-primary outline-none"
                      >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Khoảng ngày hẹn</label>
                      <div className="flex gap-1 items-center">
                        <input 
                          type="date" 
                          value={filterStartDate}
                          onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-700 focus:border-primary outline-none"
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                          type="date" 
                          value={filterEndDate}
                          onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-700 focus:border-primary outline-none"
                        />
                      </div>
                    </div>

                    {(filterStaff || filterService || filterStatus || filterStartDate || filterEndDate) && (
                      <div className="col-span-full flex justify-end">
                        <button 
                          onClick={() => {
                            setFilterStaff('');
                            setFilterService('');
                            setFilterStatus('');
                            setFilterStartDate('');
                            setFilterEndDate('');
                            setCurrentPage(1);
                          }} 
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Xóa bộ lọc
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {loadingAppts ? (
                  <div className="py-16 text-center text-xs text-slate-400 animate-pulse">Đang tải lịch hẹn...</div>
                ) : filteredAppts.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400">Không tìm thấy lịch hẹn nào</div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-medium">
                            <th className="pb-2 font-medium">Mã lịch</th>
                            <th className="pb-2 font-medium">Nhân viên</th>
                            <th className="pb-2 font-medium">Ngày & giờ</th>
                            <th className="pb-2 font-medium">Dịch vụ</th>
                            <th className="pb-2 font-medium">Trạng thái</th>
                            <th className="pb-2 text-right font-medium">Tổng tiền</th>
                            <th className="pb-2 text-center font-medium w-24">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {paginatedAppts.map((appt) => {
                            const st = statusMap[appt.status] || { label: appt.status, bg: 'bg-slate-50 text-slate-500 border-slate-100' };
                            
                            // Resolve multiple staff members for the appointment
                            const uniqueStaff = [];
                            const seen = new Set();
                            if (appt.services && appt.services.length) {
                              appt.services.forEach(s => {
                                const sname = s.staff_name || s.staff_id;
                                if (sname && !seen.has(sname)) {
                                  seen.add(sname);
                                  uniqueStaff.push({ id: s.staff_id, name: s.staff_name });
                                }
                              });
                            } else if (appt.staff_name || appt.staff_id) {
                              const sname = appt.staff_name || appt.staff_id;
                              if (sname && !seen.has(sname)) {
                                seen.add(sname);
                                uniqueStaff.push({ id: appt.staff_id, name: appt.staff_name });
                              }
                            }
                            
                            return (
                              <tr key={appt.id} className="hover:bg-slate-50/55 transition-colors">
                                <td 
                                  onClick={() => setSelectedApptDetail(appt)}
                                  className="py-3 font-medium text-primary hover:underline cursor-pointer"
                                >
                                  #{formatAppointmentId(appt.id)}
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-1.5">
                                    {uniqueStaff.length > 0 ? (
                                      <>
                                        <div className="flex -space-x-1.5 overflow-hidden">
                                          {uniqueStaff.slice(0, 3).map((stf, sIdx) => {
                                            const dbStaff = (staffList || []).find(s => s && (s.name === stf.name || s.id === stf.id));
                                            return (
                                              <div key={sIdx} className="inline-block ring-2 ring-white rounded-full">
                                                <Avatar src={dbStaff?.avatar_url} name={stf.name || 'Nhân viên'} size={22} color="#FBBF24" />
                                              </div>
                                            );
                                          })}
                                          {uniqueStaff.length > 3 && (
                                            <div className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-slate-100 text-[9px] text-slate-500 font-semibold ring-2 ring-white pr-0.5">
                                              +{uniqueStaff.length - 3}
                                            </div>
                                          )}
                                        </div>
                                        <span className="font-normal text-slate-700 truncate max-w-[120px]" title={uniqueStaff.map(s => s.name).join(', ')}>
                                          {uniqueStaff.map(s => s.name).join(', ')}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-slate-400 font-normal">Chưa phân KTV</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="font-normal text-slate-700">{formatDate(appt.date)}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{appt.time}</div>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                    {String(appt.service_name || '').split(',').filter(Boolean).map((serv, idx) => (
                                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-650 font-normal">
                                        {serv.trim()}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border ${st.bg}`}>
                                    {st.label}
                                  </span>
                                </td>
                                <td className="py-3 text-right font-medium text-slate-700">{formatVND(appt.price)}</td>
                                <td className="py-3 text-center">
                                  <div className="flex items-center justify-center gap-2 relative">
                                    {appt.status === 'completed' ? (
                                      <button 
                                        onClick={() => handleRebook(appt)} 
                                        title="Đặt lại lịch này (Rebook)"
                                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                                      >
                                        <RotateCw className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <div className="relative">
                                        <button 
                                          onClick={() => setActiveActionId(activeActionId === appt.id ? null : appt.id)}
                                          title="Cập nhật trạng thái"
                                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                                        >
                                          <MoreHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                        {activeActionId === appt.id && (
                                          <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveActionId(null)} />
                                            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 shadow-xl rounded-xl py-1 z-50 text-left text-[11px] font-normal">
                                              {appt.status === 'booked' && (
                                                <button 
                                                  onClick={() => handleUpdateApptStatus(appt, 'confirmed')}
                                                  className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                                                >
                                                  Xác nhận lịch
                                                </button>
                                              )}
                                              {(appt.status === 'booked' || appt.status === 'confirmed') && (
                                                <button 
                                                  onClick={() => handleUpdateApptStatus(appt, 'checked_in')}
                                                  className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                                                >
                                                  Check-in khách
                                                </button>
                                              )}
                                              {appt.status === 'checked_in' && (
                                                <button 
                                                  onClick={() => handleUpdateApptStatus(appt, 'completed')}
                                                  className="w-full px-3 py-1.5 hover:bg-slate-50 text-green-600 font-semibold"
                                                >
                                                  Checkout
                                                </button>
                                              )}
                                              {(appt.status === 'booked' || appt.status === 'confirmed' || appt.status === 'checked_in') && (
                                                <>
                                                  <button 
                                                    onClick={() => handleUpdateApptStatus(appt, 'no_show')}
                                                    className="w-full px-3 py-1.5 hover:bg-slate-50 text-rose-650"
                                                  >
                                                    Không đến (No show)
                                                  </button>
                                                  <button 
                                                    onClick={() => handleUpdateApptStatus(appt, 'cancelled')}
                                                    className="w-full px-3 py-1.5 hover:bg-slate-50 text-red-500 border-t border-slate-50"
                                                  >
                                                    Hủy lịch hẹn
                                                  </button>
                                                </>
                                              )}
                                              {(appt.status === 'cancelled' || appt.status === 'no_show') && (
                                                <button 
                                                  onClick={() => handleRebook(appt)}
                                                  className="w-full px-3 py-1.5 hover:bg-slate-50 text-primary"
                                                >
                                                  Rebook lịch mới
                                                </button>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    <button 
                                      onClick={() => handleDeleteAppt(appt.id)}
                                      title="Xóa lịch hẹn"
                                      className="p-1 rounded bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-650 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-1.5 pt-3 border-t border-slate-50">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(c => Math.max(c - 1, 1))}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                              currentPage === i + 1 
                                ? 'bg-primary text-white shadow-xs' 
                                : 'border border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between flex-wrap gap-2.5">
                  <h4 className="font-semibold text-sm text-slate-800">Lịch sử thanh toán hóa đơn</h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={invSearch} 
                        onChange={(e) => setInvSearch(e.target.value)} 
                        placeholder="Tìm mã hóa đơn, tên hàng..." 
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none w-48 font-normal"
                      />
                    </div>
                    <button 
                      onClick={() => setInvFilterOpen(!invFilterOpen)} 
                      className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${invFilterOpen ? 'bg-pink-50 text-primary border-pink-100' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {invFilterOpen && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 flex-wrap animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-semibold">Từ ngày</span>
                      <input 
                        type="date" 
                        value={invStartDate} 
                        onChange={(e) => setInvStartDate(e.target.value)} 
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-normal"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-semibold">Đến ngày</span>
                      <input 
                        type="date" 
                        value={invEndDate} 
                        onChange={(e) => setInvEndDate(e.target.value)} 
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none font-normal"
                      />
                    </div>
                    {(invStartDate || invEndDate || invSearch) && (
                      <button 
                        onClick={() => { setInvStartDate(''); setInvEndDate(''); setInvSearch(''); }} 
                        className="text-[10px] text-primary font-bold hover:underline ml-auto"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                )}

                {filteredInvoices.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-10">Không tìm thấy hóa đơn nào phù hợp</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-bold">Mã HĐ</th>
                          <th className="px-4 py-3 font-bold">Chi tiết dịch vụ/sản phẩm</th>
                          <th className="px-4 py-3 font-bold">Ngày tạo</th>
                          <th className="px-4 py-3 font-bold">Nhân viên</th>
                          <th className="px-4 py-3 font-bold text-right">Tổng tiền</th>
                          <th className="px-4 py-3 font-bold text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-655 font-normal">
                        {filteredInvoices.map((inv) => {
                          const invoiceStaff = [];
                          const staffMap = {};
                          (inv.items || []).forEach(it => {
                            if (it.staff_id) staffMap[it.staff_id] = it.staff_name;
                          });
                          Object.entries(staffMap).forEach(([id, name]) => {
                            invoiceStaff.push({ id, name });
                          });

                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-primary">
                                <button 
                                  onClick={() => router.push(`/invoices/${inv.id}`)} 
                                  className="hover:underline text-left font-bold"
                                >
                                  {inv.invoice_code || '—'}
                                </button>
                              </td>
                              <td className="px-4 py-3.5 max-w-[200px] truncate font-normal">
                                {(inv.items || []).map(i => i.name).join(', ')}
                              </td>
                              <td className="px-4 py-3.5 font-normal">
                                {formatDate(inv.date)}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5 font-normal">
                                  {invoiceStaff.slice(0, 3).map((s, idx) => {
                                    const stf = (staffList || []).find(x => x && x.id === s.id);
                                    return (
                                      <div key={idx} className="rounded-full ring-2 ring-white" style={{ marginLeft: idx > 0 ? '-6px' : 0 }}>
                                        <Avatar src={stf?.avatar_url} name={s.name} size={20} color={stf?.avatar_color || '#FF6B9D'} />
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-right text-pink-650">
                                {formatVND(inv.total)}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => cancelInvoicePayment(inv)} 
                                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-amber-500 hover:bg-amber-50 hover:border-amber-100 transition-colors" 
                                    title="Huỷ thanh toán & Sửa"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => { setPrintingInvoice(inv); setIsDraftPrint(false); }} 
                                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors" 
                                    title="In hoá đơn"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => deleteCustInvoice(inv)} 
                                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors" 
                                    title="Xoá hoá đơn"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'purchased_services' && renderPurchasedTable(getFilteredItems('service'), 'Dịch vụ đã mua', 'Chưa mua dịch vụ nào')}
            {activeTab === 'purchased_products' && renderPurchasedTable(getFilteredItems('product'), 'Sản phẩm đã mua', 'Chưa mua sản phẩm nào')}
            {activeTab === 'purchased_service_combos' && renderPurchasedTable(getFilteredItems('package', false), 'Combo dịch vụ đã mua', 'Chưa mua combo dịch vụ nào')}
            {activeTab === 'purchased_product_combos' && renderPurchasedTable(getFilteredItems('package', true), 'Combo sản phẩm đã mua', 'Chưa mua combo sản phẩm nào')}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-slate-800">Dòng thời gian hoạt động</h4>
                
                {/* Upgrade timeline */}
                <div className="space-y-5 pl-4 border-l border-slate-100 relative text-left">
                  <div className="relative pl-3">
                    <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white ring-4 ring-pink-50" />
                    <div className="text-xs font-semibold text-slate-700">Đăng ký hồ sơ khách hàng</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">Khởi tạo hồ sơ khách hàng mới trên hệ thống GloPro.</div>
                  </div>

                  {tierHistory.map((h, idx) => (
                    <div key={idx} className="relative pl-3">
                      <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white ring-4 ring-amber-50" />
                      <div className="text-xs font-semibold text-slate-700">
                        Cập nhật hạng thành viên: {h.old_tier_name} &rarr; {h.new_tier_name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                        {h.date} • Lý do: {h.reason}
                      </div>
                    </div>
                  ))}

                  {appointments.slice(0, 3).map((appt, idx) => (
                    <div key={idx} className="relative pl-3">
                      <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-4 ring-blue-50" />
                      <div className="text-xs font-semibold text-slate-700">Đặt lịch dịch vụ: {appt.service_name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-normal">Thực hiện bởi KTV {appt.staff_name} lúc {appt.time} ngày {formatDate(appt.date)}.</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cash_cards' && (
              <div className="space-y-4 text-left">
                <h4 className="font-semibold text-sm text-slate-800">Thẻ tiền mặt tích lũy</h4>
                {(memberships || []).filter(m => m && m.type === 'cash_card').length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-10 font-normal">Khách hàng chưa đăng ký thẻ tiền mặt nào</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(memberships || []).filter(m => m && m.type === 'cash_card').map(renderMembershipCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="space-y-4 text-left">
                <h4 className="font-semibold text-sm text-slate-800">Gói dịch vụ combo trả trước</h4>
                {(memberships || []).filter(m => m && m.type === 'package').length === 0 ? (
                  <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-slate-400 text-xs font-normal">Khách hàng chưa sở hữu gói combo dịch vụ nào</p>
                    <p className="text-[11px] text-slate-400 font-normal italic">Gợi ý: Mua gói combo Cắt tóc + Gội đầu dưỡng sinh 10 buổi tiết kiệm 15%</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(memberships || []).filter(m => m && m.type === 'package').map(renderMembershipCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'treatments' && (
              <div className="space-y-4 text-left">
                <h4 className="font-semibold text-sm text-slate-800">Thẻ liệu trình / Buổi dịch vụ</h4>
                {(memberships || []).filter(m => m && m.type !== 'cash_card' && m.type !== 'package').length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-10 font-normal">Khách hàng chưa mua thẻ liệu trình dịch vụ nào</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(memberships || []).filter(m => m && m.type !== 'cash_card' && m.type !== 'package').map(renderMembershipCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'promotions' && (
              <div className="space-y-4 text-center py-12 text-slate-450 text-xs">
                <Gift className="w-8 h-8 text-primary mx-auto opacity-75 mb-2" />
                <div className="font-semibold">Ưu đãi hạng thành viên hiện tại:</div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto font-normal">
                  Khách hàng hiện hưởng chính sách giảm giá mặc định {tier ? `${tier.discount_percent}%` : '0%'} đối với tất cả dịch vụ trong phân hạng {tier?.name || 'thành viên thường'}.
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-4 text-left">
                <h4 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-2">Lịch sử tin nhắn đã gửi cho khách hàng</h4>
                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1 animate-in fade-in duration-200">
                  {[
                    {
                      id: 1,
                      type: 'SMS',
                      sender: 'GloPro Brandname',
                      time: '10:15 AM - Hôm nay',
                      content: `Xin chào ${customer.name}, lịch hẹn của bạn tại GloPro đã hoàn thành. Hãy đánh giá dịch vụ của chúng tôi để nhận thêm 20 điểm tích lũy nhé!`,
                      status: 'Đã gửi thành công'
                    },
                    {
                      id: 2,
                      type: 'Zalo ZNS',
                      sender: 'GloPro Spa & Beauty',
                      time: '09:02 AM - 31/10/2024',
                      content: `Cảm ơn bạn ${customer.name} đã đặt lịch hẹn lúc 11:13 AM hôm nay. Trân trọng kính mời bạn đến đúng giờ để nhận phục vụ tốt nhất!`,
                      status: 'Đã nhận'
                    },
                    {
                      id: 3,
                      type: 'SMS',
                      sender: 'GloPro Brandname',
                      time: '08:00 AM - 20/10/2024',
                      content: `Mừng ngày 20/10! GloPro gửi tặng khách hàng VIP ${customer.name} mã voucher giảm 15% cho tất cả dịch vụ làm đẹp: GP2010. Đặt lịch ngay!`,
                      status: 'Đã gửi thành công'
                    }
                  ].map((msg) => (
                    <div key={msg.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${msg.type === 'SMS' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {msg.type}
                          </span>
                          <span className="font-semibold text-slate-700">{msg.sender}</span>
                        </div>
                        <span className="text-slate-400 font-normal">{msg.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-normal leading-relaxed">{msg.content}</p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5 text-green-500 font-bold" /> {msg.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {activeTab === 'notes' && (
              <div className="space-y-5 text-left">
                <h4 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-2">Ghi chú nội bộ ({notes.length})</h4>
                
                {/* Note creator form */}
                <div className="space-y-2 max-w-xl">
                  <textarea 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Ghi chú da khô, tình trạng kích ứng hoặc yêu cầu KTV riêng..." 
                    className="w-full px-4 py-3 text-xs border border-slate-200 rounded-2xl outline-none focus:border-primary min-h-[90px] text-slate-700 resize-none font-normal"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddNote}
                      className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-primary/95 transition-all flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> Thêm ghi chú mới
                    </button>
                  </div>
                </div>

                {/* Notes List Timeline */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10 font-normal">Chưa có ghi chú nội bộ cho khách hàng này</p>
                  ) : (
                    notes.map((n, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative text-xs text-slate-650">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-semibold text-slate-800">Thai Hoang (Admin)</span>
                          <span className="text-[10px] text-slate-400 font-normal font-normal">Vừa xong</span>
                        </div>
                        <p className="text-slate-600 font-normal leading-relaxed">{n}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      {/* Appointment Creation & Editing Modal (prefilled) */}
      {bookingModalOpen && (
        <AppointmentModal
          open={bookingModalOpen}
          branchId="all"
          defaultCustomer={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone
          }}
          editing={editingAppt}
          onClose={() => {
            setBookingModalOpen(false);
            setEditingAppt(null);
          }}
          onSaved={() => {
            setBookingModalOpen(false);
            setEditingAppt(null);
            loadAppointments();
          }}
        />
      )}

      {/* POS Invoice Creation Modal */}
      {posModalOpen && (
        <POSInvoiceModal
          open={posModalOpen}
          customer={customer}
          initialCart={posModalInitialCart}
          onClose={() => setPosModalOpen(false)}
          onSaved={() => {
            setPosModalOpen(false);
            if (onInvoiceCreated) onInvoiceCreated();
          }}
        />
      )}

      {/* Read-only Appointment details modal */}
      {selectedApptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedApptDetail(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative text-left text-xs text-slate-650 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-800">Thông tin chi tiết lịch hẹn</h3>
              <button onClick={() => setSelectedApptDetail(null)} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã lịch hẹn:</span>
                <span className="font-semibold text-slate-850">#{formatAppointmentId(selectedApptDetail.id)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-semibold text-slate-850">{customer.name} ({customer.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian:</span>
                <span className="font-semibold text-slate-850">{formatDate(selectedApptDetail.date)} lúc {selectedApptDetail.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dịch vụ:</span>
                <span className="font-semibold text-slate-850 text-right max-w-[250px]">{selectedApptDetail.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">KTV phụ trách:</span>
                <span className="font-semibold text-slate-850">{selectedApptDetail.staff_name || 'Chưa phân'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái:</span>
                <span className={`px-2.5 py-0.5 rounded border font-semibold ${statusMap[selectedApptDetail.status]?.bg || 'bg-slate-50 text-slate-500'}`}>
                  {statusMap[selectedApptDetail.status]?.label || selectedApptDetail.status}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <span className="text-slate-450 font-semibold text-xs">Tổng tiền:</span>
                <span className="font-bold text-sm text-pink-650">{formatVND(selectedApptDetail.price)}</span>
              </div>
              {selectedApptDetail.note && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 mt-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Ghi chú nội bộ</div>
                  <p className="text-slate-650 font-normal leading-relaxed">{selectedApptDetail.note}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setSelectedApptDetail(null)} 
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-semibold text-xs text-slate-600 text-center"
              >
                Đóng
              </button>
              {!String(selectedApptDetail.id || '').startsWith('SC_') && (
                <button 
                  onClick={() => {
                    setEditingAppt(selectedApptDetail);
                    setBookingModalOpen(true);
                    setSelectedApptDetail(null);
                  }} 
                  className="flex-1 py-2 rounded-xl bg-primary text-white font-semibold text-xs text-center hover:opacity-95 shadow-sm transition-all"
                >
                  Sửa lịch hẹn
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {printingInvoice && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/45 p-4 overflow-y-auto">
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print">
              <span className="text-sm font-bold text-slate-700">
                {isDraftPrint ? 'In hoá đơn tạm tính' : 'In hóa đơn thanh toán'}
              </span>
              <button onClick={() => setPrintingInvoice(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {/* Paper Receipt Look */}
            <div className="printable-receipt bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 font-mono text-xs text-slate-800 space-y-5 shadow-inner">
              {/* Header info */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary mb-2">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="font-bold text-sm tracking-tight">GloPro Spa & Beauty</div>
                <div className="text-[10px] text-slate-400">{printingInvoice.date || '—'}</div>
                <div className="font-black text-sm tracking-wider uppercase pt-3 text-slate-750">
                  {isDraftPrint ? 'HÓA ĐƠN TẠM TÍNH' : 'HÓA ĐƠN BÁN HÀNG'}
                </div>
                <div className="inline-block border border-dashed border-slate-300 rounded px-2.5 py-1.5 font-bold tracking-tight bg-white text-[10px] mt-1">
                  {printingInvoice.invoice_code}
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <div className="flex justify-between"><span>Tên khách hàng:</span><span className="font-bold text-right truncate max-w-[180px]">{printingInvoice.customer_name || 'Khách vãng lai'}</span></div>
                <div className="flex justify-between"><span>Số điện thoại:</span><span>{customer.phone || '—'}</span></div>
                <div className="flex justify-between"><span>Mã hóa đơn:</span><span>{printingInvoice.invoice_code}</span></div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                {(printingInvoice.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="truncate pr-2">{item.name} {item.qty > 1 && `x${item.qty}`}</span>
                    <span className="shrink-0 font-semibold">{formatVND(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <div className="flex justify-between"><span>Tạm tính:</span><span>{formatVND(printingInvoice.subtotal || 0)}</span></div>
                <div className="flex justify-between"><span>Giảm giá:</span><span>-{formatVND(printingInvoice.discount || 0)}</span></div>
                <div className="flex justify-between"><span>Thuế (Tax):</span><span>0 đ</span></div>
                <div className="flex justify-between"><span>Tiền tip:</span><span>{formatVND(printingInvoice.tip || 0)}</span></div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-sm font-black tracking-wider pb-3 border-b border-slate-200 text-slate-900">
                <span>TỔNG THANH TOÁN:</span>
                <span>{formatVND(printingInvoice.total || 0)}</span>
              </div>

              {/* Payments */}
              {!isDraftPrint && (
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Phương thức thanh toán</div>
                  {(printingInvoice.payment_methods || []).map((p, idx) => {
                    const methodLabels = {
                      cash: 'Tiền mặt',
                      transfer: 'Chuyển khoản/QR',
                      card: 'Thẻ ngân hàng',
                      ewallet: 'Ví điện tử',
                      membership: 'Thẻ membership',
                      points: 'Điểm tích lũy'
                    };
                    return (
                      <div key={idx} className="flex justify-between">
                        <span className="capitalize">{methodLabels[p.method] || p.method}</span>
                        <span className="font-semibold">{formatVND(p.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* QR block code */}
              <div className="text-center space-y-2 pt-4 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Quét mã QR để tải ứng dụng đặt lịch hẹn</div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl inline-block shadow-xs">
                  <QrCode className="w-20 h-20 text-slate-700" />
                </div>
                <div className="text-[9px] text-slate-400 max-w-[240px] mx-auto pt-2 leading-relaxed font-sans">
                  Cảm ơn quý khách đã sử dụng dịch vụ tại GloPro Spa & Beauty. Rất hân hạnh được phục vụ quý khách lần sau!
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-5 flex gap-2 w-full shrink-0 no-print">
              <button 
                onClick={() => { window.print(); toast.success('Đang thực thi in...'); }}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-650 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 bg-white"
              >
                <Printer className="w-4 h-4" /> In hóa đơn
              </button>
              <button 
                onClick={() => setPrintingInvoice(null)} 
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Card Details & Usage History Modal */}
      {selectedMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200" onClick={handleCloseMembershipModal}>
          <div className="bg-slate-50 rounded-3xl p-6 max-w-md w-full border border-slate-105 shadow-2xl relative text-left flex flex-col max-h-[85vh] animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-150/50 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">Thông tin chi tiết thẻ</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 font-sans">Thẻ & Lịch sử tiêu dùng</p>
              </div>
              <button 
                onClick={handleCloseMembershipModal} 
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 min-h-0">
              {/* Card Preview */}
              <div className="flex justify-center shrink-0">
                <div className="w-full max-w-[280px]">
                  {renderMembershipCard(selectedMembership)}
                </div>
              </div>

              {/* Card Stats */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Ngày kích hoạt</span>
                    <div className="font-semibold text-xs text-slate-700 font-sans">{formatDate(selectedMembership.purchased_date || selectedMembership.date_purchased || '')}</div>
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Ngày hết hạn</span>
                    <div className="font-semibold text-xs text-slate-700 font-sans">{selectedMembership.expiry_date ? formatDate(selectedMembership.expiry_date) : 'Vô thời hạn'}</div>
                  </div>
                </div>
                {selectedMembership.type !== 'cash_card' && (
                  <div className="pt-2 border-t border-slate-50 text-left space-y-0.5 animate-in fade-in">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Ngày đến gần nhất</span>
                    <div className="font-semibold text-xs text-slate-700 font-sans">
                      {getLastUsageDate(selectedMembership) ? formatDate(getLastUsageDate(selectedMembership)) : 'Chưa sử dụng'}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Trạng thái</span>
                    <div>
                      {selectedMembership.expiry_date && new Date(selectedMembership.expiry_date) < new Date() && selectedMembership.sessions_remaining > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 font-bold font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Đã hết hạn
                        </span>
                      ) : !selectedMembership.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-bold font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Đang bảo lưu
                        </span>
                      ) : selectedMembership.type !== 'cash_card' && selectedMembership.sessions_remaining <= 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Đã hoàn thành
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang sử dụng
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedMembership.type !== 'cash_card' && (
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Tiêu dùng</span>
                      <div className="font-semibold text-xs text-slate-700 font-sans">
                        Đã dùng {selectedMembership.total_sessions - selectedMembership.sessions_remaining}/{selectedMembership.total_sessions} buổi
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shrink-0">
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-left font-sans">Thao tác thẻ</div>
                
                {extendingExpiry ? (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 font-medium block text-left">Chọn ngày gia hạn mới:</span>
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        value={newExpiryInput}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setNewExpiryInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-sans"
                      />
                      <button 
                        onClick={async () => {
                          if (!newExpiryInput) return toast.error('Vui lòng chọn ngày gia hạn');
                          try {
                            await base44.entities.Membership.update(selectedMembership.id, { 
                              expiry_date: newExpiryInput,
                              is_active: true
                            });
                            toast.success('Gia hạn thẻ thành công');
                            setSelectedMembership(prev => ({ ...prev, expiry_date: newExpiryInput, is_active: true }));
                            setExtendingExpiry(false);
                            load();
                          } catch (e) {
                            toast.error('Lỗi khi gia hạn thẻ: ' + e.message);
                          }
                        }}
                        className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs font-sans animate-in fade-in"
                      >
                        Gia hạn
                      </button>
                      <button 
                        onClick={() => setExtendingExpiry(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-655 text-xs font-sans"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : bulkBookingOpen ? (
                  <div className="space-y-3.5 border-t border-slate-100 pt-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider font-sans">Đặt lịch hàng loạt</span>
                      <button 
                        onClick={() => {
                          setBulkBookingOpen(false);
                          setBulkBookingCustomDates([{ date: '', start_time: '09:00' }]);
                        }} 
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium font-sans"
                      >
                        Huỷ
                      </button>
                    </div>

                    {/* Mode selection tabs */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setBulkBookingType('cycle')}
                        className={`py-1.5 rounded-lg text-[10px] font-bold font-sans transition-all ${bulkBookingType === 'cycle' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                      >
                        Theo chu kỳ
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkBookingType('custom')}
                        className={`py-1.5 rounded-lg text-[10px] font-bold font-sans transition-all ${bulkBookingType === 'custom' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                      >
                        Tùy chọn ngẫu nhiên
                      </button>
                    </div>

                    {/* KTV Selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Chọn Kỹ thuật viên (KTV)</label>
                      <select
                        value={bulkBookingStaffId}
                        onChange={(e) => {
                          const sId = e.target.value;
                          setBulkBookingStaffId(sId);
                          const sObj = (staffList || []).find(x => x && x.id === sId);
                          setBulkBookingStaffName(sObj ? sObj.name : '');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-primary font-sans"
                      >
                        <option value="">Chọn KTV (Không bắt buộc)</option>
                        {(staffList || []).filter(Boolean).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    {/* Cycle Mode inputs */}
                    {bulkBookingType === 'cycle' ? (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Ngày bắt đầu</label>
                            <input 
                              type="date"
                              value={bulkBookingStartDate}
                              min={todayStr()}
                              onChange={(e) => setBulkBookingStartDate(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Giờ hẹn</label>
                            <input 
                              type="time"
                              value={bulkBookingStartTime}
                              onChange={(e) => setBulkBookingStartTime(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div className="space-y-1 col-span-2 text-left">
                            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Khoảng cách lặp</label>
                            <div className="flex gap-1 items-center">
                              <input 
                                type="number"
                                min="1"
                                value={bulkBookingInterval}
                                onChange={(e) => setBulkBookingInterval(parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-sans"
                              />
                              <select 
                                value={bulkBookingIntervalType}
                                onChange={(e) => setBulkBookingIntervalType(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none font-sans"
                              >
                                <option value="day">Ngày</option>
                                <option value="week">Tuần</option>
                                <option value="month">Tháng</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Số buổi</label>
                            <input 
                              type="number"
                              min="1"
                              max={selectedMembership.sessions_remaining}
                              value={bulkBookingSessionsCount}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setBulkBookingSessionsCount(Math.min(val, selectedMembership.sessions_remaining));
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-sans font-bold text-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Custom/Manual mode inputs */
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 animate-in fade-in duration-200">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Chọn các ngày & giờ hẹn</label>
                        {bulkBookingCustomDates.map((item, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <span className="text-[9px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                            <input 
                              type="date"
                              value={item.date}
                              min={todayStr()}
                              onChange={(e) => {
                                const nextDates = [...bulkBookingCustomDates];
                                nextDates[idx].date = e.target.value;
                                setBulkBookingCustomDates(nextDates);
                              }}
                              className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans"
                            />
                            <input 
                              type="time"
                              value={item.start_time}
                              onChange={(e) => {
                                const nextDates = [...bulkBookingCustomDates];
                                nextDates[idx].start_time = e.target.value;
                                setBulkBookingCustomDates(nextDates);
                              }}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-sans"
                            />
                            {bulkBookingCustomDates.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBulkBookingCustomDates(bulkBookingCustomDates.filter((_, i) => i !== idx));
                                }}
                                className="text-red-400 hover:text-red-650 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {bulkBookingCustomDates.length < selectedMembership.sessions_remaining && (
                          <button
                            type="button"
                            onClick={() => {
                              setBulkBookingCustomDates([...bulkBookingCustomDates, { date: '', start_time: '09:00' }]);
                            }}
                            className="w-full py-1.5 border border-dashed border-slate-200 hover:border-slate-350 rounded-xl text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1 font-sans transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm ngày hẹn
                          </button>
                        )}
                      </div>
                    )}

                    {/* Preview Generated Dates */}
                    {(() => {
                      const dates = generatePreviewDates();
                      if (dates.length === 0) return null;
                      return (
                        <div className="bg-slate-100/60 rounded-xl p-3 border border-slate-150/40 text-left space-y-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Danh sách lịch hẹn dự kiến ({dates.length} buổi):</span>
                          <div className="max-h-[90px] overflow-y-auto space-y-1 text-[11px] font-sans text-slate-650 pr-1">
                            {dates.map((d, i) => (
                              <div key={i} className="flex justify-between items-center font-normal">
                                <span>Buổi {i+1}: {formatDate(d.date)} lúc {d.start_time}</span>
                                <span className="text-[9px] text-slate-400 italic">KTV: {bulkBookingStaffName || 'Chưa phân'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={bulkBookingLoading || generatePreviewDates().length === 0}
                      onClick={handleConfirmBulkBooking}
                      className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs font-sans transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {bulkBookingLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                      Xác nhận lên lịch hẹn ({generatePreviewDates().length} buổi)
                    </button>
                  </div>
                ) : (
                  <div>
                    {selectedMembership.type !== 'cash_card' && selectedMembership.sessions_remaining > 0 && (
                      <button 
                        onClick={() => {
                          setBulkBookingSessionsCount(selectedMembership.sessions_remaining);
                          setBulkBookingOpen(true);
                        }}
                        className="w-full py-2 rounded-xl bg-pink-50 hover:bg-pink-100/75 text-primary font-bold text-xs border border-pink-150 transition-all flex items-center justify-center gap-1.5 font-sans mb-2 shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Đặt lịch hàng loạt (chu kỳ/ngẫu nhiên)
                      </button>
                    )}
                    <div className="flex gap-2">
                      {/* Expiry extension button */}
                      {selectedMembership.expiry_date && new Date(selectedMembership.expiry_date) < new Date() && selectedMembership.sessions_remaining > 0 ? (
                        <button 
                          onClick={() => {
                            setNewExpiryInput(selectedMembership.expiry_date || '');
                            setExtendingExpiry(true);
                          }}
                          className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors text-center font-sans"
                        >
                          {selectedMembership.type === 'package' ? 'Gia hạn gói' : 'Gia hạn liệu trình'}
                        </button>
                      ) : selectedMembership.type !== 'cash_card' && selectedMembership.sessions_remaining <= 0 ? (
                        <div className="flex-1 text-center py-2 text-slate-400 font-semibold text-xs bg-slate-50 rounded-xl border border-slate-200/60 font-sans">
                          {selectedMembership.type === 'package' ? 'Gói dịch vụ đã hoàn thành' : 'Liệu trình đã hoàn thành'}
                        </div>
                      ) : selectedMembership.is_active ? (
                        <button 
                          onClick={async () => {
                            try {
                              const today = todayStr();
                              await base44.entities.Membership.update(selectedMembership.id, { 
                                is_active: false,
                                suspended_at: today
                              });
                              toast.success('Đã bảo lưu thẻ thành công');
                              setSelectedMembership(prev => ({ ...prev, is_active: false, suspended_at: today }));
                              load();
                            } catch (e) {
                              toast.error('Lỗi khi bảo lưu thẻ: ' + e.message);
                            }
                          }}
                          className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition-colors text-center font-sans"
                        >
                          Bảo lưu thẻ
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            try {
                              let newExpiryDate = selectedMembership.expiry_date;
                              if (selectedMembership.suspended_at && selectedMembership.expiry_date) {
                                const start = new Date(selectedMembership.suspended_at);
                                const end = new Date();
                                const diffTime = Math.abs(end - start);
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (diffDays > 0) {
                                  const expiry = new Date(selectedMembership.expiry_date);
                                  expiry.setDate(expiry.getDate() + diffDays);
                                  newExpiryDate = expiry.toISOString().slice(0, 10);
                                }
                              }
                              
                              await base44.entities.Membership.update(selectedMembership.id, { 
                                is_active: true,
                                suspended_at: null,
                                expiry_date: newExpiryDate
                              });
                              toast.success('Đã kích hoạt lại thẻ thành công');
                              setSelectedMembership(prev => ({ 
                                ...prev, 
                                is_active: true, 
                                suspended_at: null, 
                                expiry_date: newExpiryDate 
                              }));
                              load();
                            } catch (e) {
                              toast.error('Lỗi khi kích hoạt lại thẻ: ' + e.message);
                            }
                          }}
                          className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors text-center font-sans"
                        >
                          Kích hoạt lại
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          alert(selectedMembership.type === 'package' 
                            ? 'Để xoá gói dịch vụ, vui lòng xoá gói dịch vụ tại hoá đơn bán gói.' 
                            : 'Để xoá liệu trình, vui lòng xoá liệu trình tại hoá đơn bán liệu trình.'
                          );
                        }}
                        className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors text-center font-sans"
                      >
                        Xoá thẻ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Spending History Title */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Lịch sử giao dịch</div>
                
                <div className="space-y-2">
                  {getMembershipHistory(selectedMembership).length === 0 ? (
                    <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-slate-400 text-xs font-normal font-sans">Chưa ghi nhận giao dịch nào</p>
                    </div>
                  ) : (
                    getMembershipHistory(selectedMembership).map((hist, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-colors shadow-xs">
                        <div className="space-y-1 text-left">
                          <div className="font-bold text-slate-750 text-xs flex items-center gap-1.5 font-sans">
                            <span 
                              onClick={() => {
                                setSelectedMembership(null);
                                router.push(`/invoices/${hist.id}`);
                              }}
                              className="text-primary hover:underline cursor-pointer font-bold font-sans"
                            >
                              {hist.invoice_code || 'Hóa đơn'}
                            </span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider font-sans ${
                              hist.type === 'purchase' 
                                ? 'bg-green-50 text-green-600 border-green-100' 
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {hist.type === 'purchase' ? 'Mua mới' : 'Khấu trừ'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium font-sans">{hist.description} • {formatDate(hist.date)}</div>
                        </div>
                        <div className="text-right">
                          {selectedMembership.type === 'cash_card' ? (
                            <div className={`font-black text-sm font-mono ${
                              hist.type === 'purchase' ? 'text-green-600' : 'text-rose-600'
                            }`}>
                              {hist.type === 'purchase' ? '+' : '-'}
                              {formatVND(hist.amount)}
                            </div>
                          ) : (
                            hist.type === 'usage' && (
                              <div className="font-black text-sm font-mono text-rose-600">
                                -{hist.amount} buổi
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-150/50 flex justify-end shrink-0 mt-4">
              <button 
                onClick={handleCloseMembershipModal}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors w-full font-sans"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function CustomerForm({ customer, groups = [], onClose, onSave }) {
  const initialFirstName = customer.first_name || (() => {
    if (!customer.name) return '';
    const parts = customer.name.trim().split(/\s+/);
    return parts.slice(1).join(' ');
  })();
  const initialLastName = customer.last_name || (() => {
    if (!customer.name) return '';
    const parts = customer.name.trim().split(/\s+/);
    return parts[0] || '';
  })();

  const [f, setF] = useState({
    name: customer.name || '',
    first_name: initialFirstName,
    last_name: initialLastName,
    phone: customer.phone || '',
    email: customer.email || '',
    gender: customer.gender || 'female',
    birthday: customer.birthday || '',
    address: customer.address || '',
    note: customer.note || '',
    avatar_url: customer.avatar_url || '',
    group_id: customer.group_id || '',
    client_source: customer.client_source || '',
    notify_email: !!customer.notify_email,
    notify_sms: !!customer.notify_sms,
    referred_type: customer.referred_type || 'staff',
    referred_id: customer.referred_id || ''
  });

  const [staffList, setStaffList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Staff.list().catch(() => []),
      base44.entities.Customer.list().catch(() => [])
    ]).then(([st, cu]) => {
      setStaffList(st);
      setCustomerList(cu);
    });
  }, []);

  const selectedReferred = (() => {
    if (f.referred_type === 'staff') {
      return staffList.find(s => s && String(s.id) === String(f.referred_id));
    }
    if (f.referred_type === 'customer') {
      return customerList.find(c => c && String(c.id) === String(f.referred_id));
    }
    return null;
  })();

  const handleSave = () => {
    if (!f.first_name.trim()) return toast.error('Vui lòng nhập tên khách hàng');
    if (!f.phone.trim()) return toast.error('Vui lòng nhập số điện thoại');
    onSave(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/45 backdrop-blur-xs" onClick={onClose}>
      <div className="relative bg-white w-full md:max-w-xl rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">
            {customer.id ? 'Sửa khách hàng' : 'Thêm khách hàng'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Stack with Spacing */}
        <div className="space-y-3.5 text-left flex-grow">
          {/* Họ & Tên */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Họ</label>
              <input 
                value={f.last_name} 
                onChange={(e) => setF({ ...f, last_name: e.target.value })} 
                placeholder="Ví dụ: Nguyễn" 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary bg-white text-slate-700" 
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Tên *</label>
              <input 
                value={f.first_name} 
                onChange={(e) => setF({ ...f, first_name: e.target.value })} 
                placeholder="Ví dụ: Anh" 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary bg-white text-slate-700" 
              />
            </div>
          </div>
          
          {/* Số điện thoại & Email */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Số điện thoại *</label>
              <input 
                value={f.phone} 
                onChange={(e) => setF({ ...f, phone: e.target.value })} 
                placeholder="Số điện thoại *" 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary bg-white text-slate-700" 
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Địa chỉ email</label>
              <input 
                value={f.email} 
                onChange={(e) => setF({ ...f, email: e.target.value })} 
                placeholder="Địa chỉ email" 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary bg-white text-slate-700" 
              />
            </div>
          </div>
          
          {/* Địa chỉ */}
          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Địa chỉ</label>
            <input 
              value={f.address} 
              onChange={(e) => setF({ ...f, address: e.target.value })} 
              placeholder="Địa chỉ" 
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary bg-white text-slate-700" 
            />
          </div>

          {/* Giới tính & Ngày sinh */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Giới tính</label>
              <div className="relative">
                <select 
                  value={f.gender} 
                  onChange={(e) => setF({ ...f, gender: e.target.value })} 
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none"
                >
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                  <option value="other">Khác</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ngày sinh</label>
              <div className="relative">
                <input 
                  type={f.birthday ? "date" : "text"} 
                  value={f.birthday} 
                  onFocus={(e) => e.target.type = 'date'}
                  onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                  onChange={(e) => setF({ ...f, birthday: e.target.value })} 
                  placeholder="Ngày sinh" 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none text-slate-700 bg-white" 
                />
              </div>
            </div>
          </div>

          {/* Nhóm & Nguồn */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Nhóm khách hàng</label>
              <div className="relative">
                <select 
                  value={f.group_id} 
                  onChange={(e) => setF({ ...f, group_id: e.target.value })} 
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none"
                >
                  <option value="">— Chọn nhóm —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Nguồn khách hàng</label>
              <div className="relative">
                <select 
                  value={f.client_source} 
                  onChange={(e) => setF({ ...f, client_source: e.target.value })} 
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none"
                >
                  <option value="">— Chọn nguồn khách —</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Tiktok">Tiktok</option>
                  <option value="Giới thiệu">Giới thiệu</option>
                  <option value="Khác">Khác</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notifications config */}
          <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">Thông báo lịch hẹn</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={f.notify_email} 
                  onChange={(e) => setF({ ...f, notify_email: e.target.checked })} 
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" 
                />
                <span className="text-xs font-medium text-slate-600">Email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={f.notify_sms} 
                  onChange={(e) => setF({ ...f, notify_sms: e.target.checked })} 
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" 
                />
                <span className="text-xs font-medium text-slate-600">SMS</span>
              </label>
            </div>
          </div>

          {/* Referred by card (defensive layout grid with custom Avatar selection list) */}
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 space-y-3">
            <span className="block text-xs font-semibold text-slate-500">Được giới thiệu bởi</span>
            
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                onClick={() => setF({ ...f, referred_type: 'staff', referred_id: '' })} 
                className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center ${f.referred_type === 'staff' ? 'bg-white border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
              >
                Nhân viên
              </button>
              
              <button 
                type="button" 
                onClick={() => setF({ ...f, referred_type: 'customer', referred_id: '' })} 
                className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center ${f.referred_type === 'customer' ? 'bg-white border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
              >
                Khách hàng
              </button>

              <button 
                type="button" 
                onClick={() => setF({ ...f, referred_type: 'none', referred_id: '' })} 
                className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center ${f.referred_type === 'none' ? 'bg-white border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
              >
                Không có
              </button>
            </div>

            {f.referred_type !== 'none' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen(!pickerOpen)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 focus:border-primary transition-colors text-left"
                >
                  {selectedReferred ? (
                    <>
                      <Avatar src={selectedReferred.avatar_url} name={selectedReferred.name || selectedReferred.full_name} size={20} color={selectedReferred.avatar_color} />
                      <span className="truncate text-slate-700">{selectedReferred.name || selectedReferred.full_name}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">— Chọn người giới thiệu —</span>
                  )}
                  <ChevronDown className="w-4 h-4 ml-auto text-slate-400 shrink-0" />
                </button>

                {pickerOpen && (
                  <>
                    <div className="fixed inset-0 z-[60] bg-transparent" onClick={() => setPickerOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 z-[70] bg-white rounded-xl border border-slate-150 shadow-2xl py-1 max-h-56 overflow-y-auto">
                      {f.referred_type === 'staff' ? (
                        staffList.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setF({ ...f, referred_id: s.id });
                              setPickerOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-xs text-left"
                          >
                            <Avatar src={s.avatar_url} name={s.name || s.full_name} size={24} color={s.avatar_color} />
                            <span className="truncate text-slate-700">{s.name || s.full_name}</span>
                          </button>
                        ))
                      ) : (
                        customerList
                          .filter(c => c.id !== customer.id)
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setF({ ...f, referred_id: c.id });
                                setPickerOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-xs text-left"
                            >
                              <Avatar src={c.avatar_url} name={c.name} size={24} color="#FF6B9D" />
                              <span className="truncate text-slate-700">{c.name}</span>
                            </button>
                          ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ghi chú</label>
            <textarea 
              value={f.note} 
              onChange={(e) => setF({ ...f, note: e.target.value })} 
              placeholder="Ghi chú (dị ứng, sở thích...)" 
              rows={3} 
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 resize-none bg-white" 
            />
          </div>

          {/* Avatar Upload (Without duplicate span header) */}
          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ảnh đại diện</label>
            <ImageUpload value={f.avatar_url} onChange={(v) => setF({ ...f, avatar_url: v })} label="" shape="circle" />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">
            Hủy
          </button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}