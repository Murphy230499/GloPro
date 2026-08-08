'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, X, MapPin, Phone, User, Edit3, Trash2, 
  Building, Users, ShieldAlert, Shield, Check, ShieldCheck, Mail, CheckCircle2, Share2 
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import RoleManager from '@/components/settings/RoleManager';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import { base44, getCachedPermissions, clearCachedPermissions } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useBranch } from '@/lib/BranchContext';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';

const ROLE_LABELS = {
  owner: 'Chủ Salon (Owner)',
  admin: 'Quản trị (Admin)',
  cashier: 'Thu ngân'
};

const MODULE_GROUPS = [
  {
    id: 1,
    title: '1. Tổng quan',
    modules: {
      dashboard_view: 'Xem các thống kê nhanh trong ngày'
    }
  },
  {
    id: 2,
    title: '2. Quản lý Lịch hẹn',
    modules: {
      appointment_view: 'Xem lịch đặt hẹn',
      appointment_add: 'Đặt lịch hẹn mới cho khách',
      appointment_edit: 'Chỉnh sửa ca/thời gian đặt hẹn',
      appointment_cancel: 'Hủy lịch hẹn của khách'
    }
  },
  {
    id: 3,
    title: '3. Thu ngân & POS',
    modules: {
      pos_view: 'Truy cập màn hình bán hàng',
      pos_checkout_cash: 'Thanh toán bằng tiền mặt',
      pos_checkout_bank: 'Thanh toán bằng chuyển khoản/thẻ',
      pos_select_staff: 'Chọn nhân viên phục vụ',
      pos_apply_discount: 'Áp dụng chiết khấu/giảm giá',
      pos_cancel_ticket: 'Hủy/xóa vé dịch vụ'
    }
  },
  {
    id: 4,
    title: '4. Quản lý Hóa đơn',
    modules: {
      invoice_view: 'Xem danh sách hóa đơn',
      invoice_detail_view: 'Xem chi tiết nội dung hóa đơn',
      invoice_refund: 'Hoàn tiền/hủy hóa đơn đã thanh'
    }
  },
  {
    id: 5,
    title: '5. Quản lý Khách hàng',
    modules: {
      customer_view: 'Xem danh sách khách hàng',
      customer_add: 'Thêm mới khách hàng',
      customer_edit: 'Chỉnh sửa thông tin khách hàng',
      customer_delete: 'Xóa tài khoản khách hàng',
      customer_prepaid_view: 'Xem số dư thẻ trả trước',
      customer_prepaid_recharge: 'Nạp tiền thẻ trả trước',
      customer_membership_view: 'Xem gói thành viên/dịch vụ',
      customer_membership_buy: 'Bán gói thành viên/dịch vụ',
      customer_membership_use: 'Trừ ca/buổi gói dịch vụ'
    }
  },
  {
    id: 6,
    title: '6. Đánh giá Khách hàng',
    modules: {
      customer_reviews_view: 'Xem đánh giá phản hồi',
      customer_reviews_reply: 'Gửi phản hồi đánh giá của khách'
    }
  },
  {
    id: 7,
    title: '7. Danh mục Dịch vụ & Sản phẩm',
    modules: {
      catalog_view: 'Xem danh mục dịch vụ, sản phẩm',
      catalog_service_edit: 'Thêm/sửa/xóa dịch vụ',
      catalog_product_edit: 'Thêm/sửa/xóa sản phẩm',
      catalog_combo_edit: 'Thiết lập các gói combo'
    }
  },
  {
    id: 8,
    title: '8. Quản lý Kho hàng',
    modules: {
      inventory_view: 'Xem tồn kho sản phẩm',
      inventory_adjust: 'Điều chỉnh số lượng kiểm kho',
      inventory_import: 'Nhập kho hàng hóa'
    }
  },
  {
    id: 9,
    title: '9. Khuyến mãi & Giảm giá',
    modules: {
      discount_view: 'Xem chương trình khuyến mãi',
      discount_edit: 'Tạo mã voucher, chương trình khuyến mãi',
      discount_delete: 'Xóa chương trình khuyến mãi'
    }
  },
  {
    id: 10,
    title: '10. Chiến dịch Tự động / Marketing',
    modules: {
      automation_view: 'Xem chiến dịch tự động',
      automation_edit: 'Kích hoạt/sửa chiến dịch tự động'
    }
  },
  {
    id: 11,
    title: '11. Quản lý Đặt cọc',
    modules: {
      deposit_view: 'Xem đặt cọc lịch hẹn',
      deposit_refund: 'Hoàn trả tiền cọc'
    }
  },
  {
    id: 12,
    title: '12. Quản lý Dòng tiền / Thu chi',
    modules: {
      cashflow_view: 'Xem sổ quỹ dòng tiền',
      cashflow_add: 'Tạo phiếu thu/chi ngoài'
    }
  },
  {
    id: 13,
    title: '13. Nhân viên & Lương',
    modules: {
      staff_view: 'Xem danh sách nhân viên',
      staff_add: 'Thêm nhân sự mới',
      staff_edit: 'Chỉnh sửa thông tin nhân viên',
      staff_delete: 'Vô hiệu hóa/xóa nhân viên',
      staff_schedule_view: 'Xem lịch làm việc',
      staff_schedule_edit: 'Xếp lịch ca làm việc',
      staff_attendance_view: 'Xem giờ chấm công',
      staff_attendance_edit: 'Điều chỉnh/duyệt chấm công',
      staff_commission_config: 'Cấu hình hoa hồng dịch vụ',
      staff_payroll_view: 'Xem bảng tính lương',
      staff_payroll_approve: 'Duyệt chi lương nhân viên'
    }
  },
  {
    id: 14,
    title: '14. Báo cáo tài chính & AI',
    modules: {
      report_view: 'Truy cập mô-đun báo cáo',
      report_overview_view: 'Xem chỉ số KPI tổng quan',
      report_revenue_view: 'Xem báo cáo doanh thu',
      report_finance_view: 'Xem báo cáo dòng tiền/tài chính',
      report_ai_generate: 'Dùng trí tuệ nhân tạo (AI) tạo báo cáo',
      report_export: 'Xuất file báo cáo Excel/PDF'
    }
  },
  {
    id: 15,
    title: '15. Cài đặt hệ thống',
    modules: {
      setting_branch_view: 'Xem danh sách chi nhánh',
      setting_branch_edit: 'Thêm/sửa/xóa chi nhánh',
      setting_account_view: 'Xem tài khoản người dùng',
      setting_account_edit: 'Thêm/sửa/khóa tài khoản',
      setting_role_manage: 'Quản lý vai trò (owner, admin, thu ngân)',
      setting_permission_edit: 'Chỉnh sửa bảng phân quyền',
      setting_integration_view: 'Xem cấu hình tích hợp (Facebook, Zalo...)',
      setting_integration_edit: 'Chỉnh sửa/kết nối các dịch vụ tích hợp'
    }
  }
];

const MODULE_LABELS = MODULE_GROUPS.reduce((acc, g) => ({ ...acc, ...g.modules }), {});

export default function SettingsPage() {
  const t = useT();
  const { branches, loading: loadingBranches } = useBranch();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab) return tab;
      return sessionStorage.getItem('settings_active_tab') || 'branches';
    }
    return 'branches';
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('settings_active_tab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };
  
  // Current user permissions
  const [myProfile, setMyProfile] = useState(null);
  const [myPermissions, setMyPermissions] = useState([]);
  const [loadingMyPerms, setLoadingMyPerms] = useState(true);

  // States for Branches
  const [editingBranch, setEditingBranch] = useState(null);

  // States for Accounts
  const [profiles, setProfiles] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // States for Permissions
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  // State for Role Manager Popup
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    async function loadMyProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email;
          const userProfiles = await base44.entities.UserProfile.list();
          const found = userProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
          if (found) {
            setMyProfile(found);
            const cached = await getCachedPermissions();
            setMyPermissions(cached);
          }
        }
      } catch (err) {
        console.error('Error loading current profile permissions:', err);
      } finally {
        setLoadingMyPerms(false);
      }
    }
    loadMyProfile();
  }, []);

  const isMyPermissionAllowed = (key) => {
    if (!myPermissions) return true;
    if (myPermissions === 'all') return true;
    if (myPermissions.type === 'blacklist') {
      return !myPermissions.blocked.includes(key);
    }
    return true;
  };

  useEffect(() => {
    if (myPermissions && myPermissions !== 'all') {
      const allowed = [];
      if (isMyPermissionAllowed('setting_branch_view')) allowed.push('branches');
      if (isMyPermissionAllowed('setting_account_view')) allowed.push('accounts');
      if (isMyPermissionAllowed('setting_permission_edit')) allowed.push('permissions');
      if (isMyPermissionAllowed('setting_integration_view')) allowed.push('integrations');
      
      if (allowed.length > 0 && !allowed.includes(activeTab)) {
        handleTabChange(allowed[0]);
      }
    }
  }, [myPermissions]);

  // Fetch roles list
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const data = await base44.entities.Role.list();
      const systemRoles = [
        { code: 'owner', name: 'Chủ Salon (Owner)', description: 'Quyền hạn tối cao toàn hệ thống.', is_system: true },
        { code: 'admin', name: 'Quản trị (Admin)', description: 'Quản lý các hoạt động vận hành thường nhật.', is_system: true },
        { code: 'cashier', name: 'Thu ngân', description: 'Thực hiện bán hàng và quản lý danh sách khách hàng.', is_system: true }
      ];
      if (!data || data.length === 0) {
        setRoles(systemRoles);
      } else {
        const merged = [...systemRoles];
        (data || []).forEach(r => {
          if (!merged.some(m => m.code === r.code)) {
            merged.push(r);
          }
        });
        setRoles(merged);
      }
    } catch (e) {
      console.error('Error fetching roles:', e);
      setRoles([
        { code: 'owner', name: 'Chủ Salon (Owner)', description: 'Quyền hạn tối cao toàn hệ thống.', is_system: true },
        { code: 'admin', name: 'Quản trị (Admin)', description: 'Quản lý các hoạt động vận hành thường nhật.', is_system: true },
        { code: 'cashier', name: 'Thu ngân', description: 'Thực hiện bán hàng và quản lý danh sách khách hàng.', is_system: true }
      ]);
    }
    setLoadingRoles(false);
  };

  // Fetch accounts list
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      let data = await base44.entities.UserProfile.list();
      
      // Auto-populate currently logged in user as Owner if they don't exist in UserProfile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email;
        const exists = (data || []).some(p => p.email.toLowerCase() === email.toLowerCase());
        if (!exists) {
          try {
            const newProfile = await base44.entities.UserProfile.create({
              email: email,
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Đức Lê Đình',
              role: 'owner'
            });
            if (newProfile) {
              data = [...(data || []), newProfile];
            }
          } catch (createErr) {
            console.error('Error auto-creating owner profile:', createErr);
            // Fallback: manually push a mock owner profile to the list so it is guaranteed to show
            data = [...(data || []), {
              id: 'temp-owner-id',
              email: email,
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Đức Lê Đình',
              role: 'owner',
              branch_id: null
            }];
          }
        }
      }
      
      setProfiles(data || []);
    } catch (e) {
      console.error('Lỗi khi lấy tài khoản:', e);
      // Fallback in case of general query failures
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setProfiles([{
          id: 'temp-owner-id',
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Đức Lê Đình',
          role: 'owner',
          branch_id: null
        }]);
      }
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch permissions matrix
  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const data = await base44.entities.RolePermission.list();
      setPermissions(data || []);
    } catch (e) {
      console.error('Lỗi khi lấy phân quyền:', e);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'accounts') {
      fetchAccounts();
      fetchRoles();
    } else if (activeTab === 'permissions') {
      fetchPermissions();
      fetchRoles();
    }
  }, [activeTab]);

  // Save Branch
  const saveBranch = async (data) => {
    try {
      if (editingBranch.id) {
        await base44.entities.Branch.update(editingBranch.id, data);
        toast.success('Đã cập nhật cơ sở');
      } else {
        await base44.entities.Branch.create(data);
        toast.success('Đã thêm cơ sở');
      }
      setEditingBranch(null);
      setTimeout(() => window.location.reload(), 600);
    } catch (e) { 
      toast.error('Lỗi: ' + (e.message || e)); 
    }
  };

  // Remove Branch
  const removeBranch = async (b) => {
    if (!confirm(`Xóa cơ sở "${b.name}"?`)) return;
    try {
      await base44.entities.Branch.delete(b.id);
      toast.success('Đã xóa chi nhánh');
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  // Save Account
  const saveAccount = async (data) => {
    try {
      // If it is the first account, force owner role
      const isFirst = profiles.length === 0;
      const payload = {
        ...data,
        role: isFirst ? 'owner' : data.role
      };

      if (editingAccount.id) {
        await base44.entities.UserProfile.update(editingAccount.id, payload);
        toast.success('Đã cập nhật tài khoản');
      } else {
        const response = await fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || 'Gửi lời mời kích hoạt thất bại');
        }
        toast.success('Đã gửi email kích hoạt và tạo tài khoản!');
      }
      setEditingAccount(null);
      fetchAccounts();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  // Remove Account
  const removeAccount = async (acc) => {
    if (acc.role === 'owner') {
      return toast.error('Không thể xóa tài khoản Chủ Salon (Owner)');
    }
    if (!confirm(`Xóa tài khoản "${acc.full_name}"?`)) return;
    try {
      await base44.entities.UserProfile.delete(acc.id);
      toast.success('Đã xóa tài khoản');
      fetchAccounts();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  // Toggle permission flag
  const togglePermission = async (perm) => {
    try {
      const updatedVal = !perm.can_view;
      const isTemp = String(perm.id).includes('_');

      if (isTemp) {
        const created = await base44.entities.RolePermission.create({
          role: perm.role,
          module: perm.module,
          can_view: updatedVal,
          can_edit: updatedVal
        });
        setPermissions(prev => [...prev, created]);
      } else {
        await base44.entities.RolePermission.update(perm.id, {
          can_view: updatedVal,
          can_edit: updatedVal
        });
        setPermissions(prev => prev.map(p => p.id === perm.id ? { ...p, can_view: updatedVal, can_edit: updatedVal } : p));
      }
      clearCachedPermissions();
      toast.success('Đã cập nhật quyền hạn');
    } catch (e) {
      toast.error('Lỗi khi cập nhật quyền: ' + (e.message || e));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">{t('settings.page_title', 'Cài đặt hệ thống')}</h1>
        <p className="text-slate-400 text-sm mt-1">{t('settings.page_subtitle', 'Cấu hình các phân hệ chi nhánh, tài khoản và quyền hoạt động.')}</p>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        {isMyPermissionAllowed('setting_branch_view') && (
          <button
            onClick={() => handleTabChange('branches')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
              activeTab === 'branches'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span>{t('settings.tab_branches', 'Chi nhánh')}</span>
          </button>
        )}
        {isMyPermissionAllowed('setting_account_view') && (
          <button
            onClick={() => handleTabChange('accounts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
              activeTab === 'accounts'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{t('settings.tab_accounts', 'Tài khoản')}</span>
          </button>
        )}
        {isMyPermissionAllowed('setting_permission_edit') && (
          <button
            onClick={() => handleTabChange('permissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
              activeTab === 'permissions'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t('settings.tab_permissions', 'Phân quyền')}</span>
          </button>
        )}
        {isMyPermissionAllowed('setting_integration_view') && (
          <button
            onClick={() => handleTabChange('integrations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
              activeTab === 'integrations'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>{t('settings.tab_integrations', 'Tích hợp')}</span>
          </button>
        )}
      </div>

      {/* Tab 1: Chi nhánh */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={() => setEditingBranch({})} 
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> {t('settings.btn_add_branch', 'Thêm cơ sở')}
            </button>
          </div>

          {loadingBranches ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingBranch(b)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button onClick={() => removeBranch(b)} className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="font-bold text-lg mt-4 text-slate-800">{b.name}</div>
                    <div className="space-y-1.5 mt-3">
                      {b.address && <div className="text-sm text-slate-500 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400 shrink-0" />{b.address}</div>}
                      {b.phone && <div className="text-sm text-slate-500 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400 shrink-0" />{b.phone}</div>}
                      {b.manager_name && <div className="text-sm text-slate-500 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400 shrink-0" />{t('settings.branch_manager_prefix', 'QL:')} {b.manager_name}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tài khoản */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">{t('settings.account_list_title', 'Danh sách tài khoản')}</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowRoleManager(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm shadow-xs transition-all active:scale-95"
              >
                <Shield className="w-4 h-4 text-slate-500" /> {t('settings.btn_roles', 'Vai trò')}
              </button>
              <button 
                onClick={() => setEditingAccount({ 
                  role: 'cashier', 
                  type: 'Employee', 
                  status: 'active', 
                  branch_ids: branches[0]?.id ? [branches[0].id] : [],
                  first_name: '',
                  last_name: '',
                  phone: '',
                  email: '',
                  avatar_url: ''
                })} 
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> {t('settings.btn_add_account', 'Thêm tài khoản')}
              </button>
            </div>
          </div>

          {loadingAccounts ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">{t('settings.col_account_code', 'MÃ TK')}</th>
                      <th className="px-6 py-4">{t('settings.col_display_name', 'TÊN HIỂN THỊ')}</th>
                      <th className="px-6 py-4">{t('settings.col_phone', 'SỐ ĐIỆN THOẠI')}</th>
                      <th className="px-6 py-4">{t('settings.col_email', 'EMAIL')}</th>
                      <th className="px-6 py-4">{t('settings.col_type', 'PHÂN LOẠI')}</th>
                      <th className="px-6 py-4">{t('settings.col_role', 'VAI TRÒ')}</th>
                      <th className="px-6 py-4">{t('settings.col_operating_branch', 'CHI NHÁNH HOẠT ĐỘNG')}</th>
                      <th className="px-6 py-4 text-right">{t('settings.col_actions', 'THAO TÁC')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {profiles.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-10 text-slate-400">
                          {t('settings.no_accounts_yet', 'Chưa có tài khoản đăng nhập nào được khởi tạo.')}
                        </td>
                      </tr>
                    ) : (
                      profiles.map((acc, index) => {
                        // Resolve multiple branches
                        const assignedBranchNames = (acc.branch_ids || [])
                          .map(bId => branches.find(b => b.id === bId)?.name)
                          .filter(Boolean);
                          
                        const locationText = acc.role === 'owner' 
                          ? t('settings.all_branches', 'Tất cả chi nhánh') 
                          : assignedBranchNames.length > 0 
                          ? assignedBranchNames.join(', ') 
                          : t('settings.unassigned_branch', 'Chưa phân chi nhánh');

                        // Status badges
                        let statusColor = 'bg-slate-50 text-slate-600 border border-slate-100';
                        let statusText = t('settings.status_disabled', 'Vô hiệu hóa');
                        if (acc.status === 'active') {
                          statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                          statusText = t('settings.status_active', 'Hoạt động');
                        } else if (acc.status === 'pending') {
                          statusColor = 'bg-amber-50 text-amber-600 border border-amber-100';
                          statusText = t('settings.status_pending', 'Chờ kích hoạt');
                        } else if (acc.status === 'deleted') {
                          statusColor = 'bg-red-50 text-red-600 border border-red-100';
                          statusText = t('settings.status_deleted', 'Đã xóa');
                        }

                        // Type label
                        const typeText = acc.type === 'User' ? t('settings.type_user', 'Khách hàng (User)') : t('settings.type_employee', 'Nhân viên');

                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-4 text-xs font-mono text-slate-400 uppercase">
                              ACC_{String(index + 1).padStart(6, '0')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                                  {acc.avatar_url ? (
                                    <img src={acc.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-5 h-5 text-slate-450" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800 leading-tight">
                                    {acc.full_name || acc.email}
                                  </span>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 max-w-fit ${statusColor}`}>
                                    {statusText}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {acc.phone || '-'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {acc.email}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {typeText}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                acc.role === 'owner' 
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                  : acc.role === 'admin'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                  : 'bg-slate-50 text-slate-600 border border-slate-100'
                              }`}>
                                {t('settings.role_' + acc.role, ROLE_LABELS[acc.role] || acc.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={locationText}>
                              {locationText}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => setEditingAccount(acc)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeAccount(acc)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Phân quyền */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('settings.permission_note', '**Lưu ý:** Quyền hạn đối với vai trò **Chủ Salon (Owner)** được gán mặc định tối cao và không thể thay đổi. Các vai trò khác hệ thống và tự định nghĩa có thể thay đổi bật/tắt quyền xem hoặc chỉnh sửa tương ứng cho từng phân hệ.')}
            </p>
          </div>

          {loadingPermissions ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">{t('settings.permission_module_col', 'Phân hệ chức năng')}</th>
                      {(roles.length > 0 ? roles : [
                        { code: 'admin', name: 'Quản trị (Admin)' },
                        { code: 'cashier', name: 'Thu ngân' }
                      ]).filter(r => r.code !== 'owner').map(role => (
                        <th key={role.code} className="px-6 py-4 text-center border-l border-slate-100/60">
                          {t('settings.role_' + role.code, role.name)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {MODULE_GROUPS.map((group) => {
                      const rolesForMatrix = (roles.length > 0 ? roles : [
                        { code: 'admin', name: 'Quản trị (Admin)' },
                        { code: 'cashier', name: 'Thu ngân' }
                      ]).filter(r => r.code !== 'owner');

                      return (
                        <React.Fragment key={group.title}>
                          {/* Group header row */}
                          <tr className="bg-slate-50 border-y border-slate-200/60">
                            <td 
                              colSpan={rolesForMatrix.length + 1}
                              className="px-6 py-3 font-bold text-slate-700 text-[13px] uppercase tracking-wider bg-slate-50/80"
                            >
                              {t('settings.perm_group_' + group.id, group.title)}
                            </td>
                          </tr>
                          {Object.entries(group.modules).map(([moduleKey, label]) => {
                            return (
                              <tr key={moduleKey} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-3 text-slate-500 font-normal text-xs">
                                  {t('settings.perm_mod_' + moduleKey, label)}
                                </td>
                                
                                {rolesForMatrix.map(role => {
                                  const perm = permissions.find(p => p.role === role.code && p.module === moduleKey) || {
                                    id: `${role.code}_${moduleKey}`,
                                    role: role.code,
                                    module: moduleKey,
                                    can_view: true,
                                    can_edit: true
                                  };

                                  return (
                                    <td key={role.code} className="px-6 py-3.5 text-center border-l border-slate-50/60">
                                      <input
                                        type="checkbox"
                                        checked={perm.can_view}
                                        onChange={() => togglePermission(perm)}
                                        className="w-4 h-4 rounded text-emerald-600 border-slate-350 focus:ring-emerald-500 cursor-pointer animate-all active:scale-90"
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit/Add Branch Form Modal */}
      {editingBranch && (
        <BranchForm branch={editingBranch} onClose={() => setEditingBranch(null)} onSave={saveBranch} />
      )}

      {/* Edit/Add Account Form Modal */}
      {editingAccount && (
        <AccountForm 
          account={editingAccount} 
          branches={branches}
          roles={roles}
          isFirst={profiles.length === 0}
          onClose={() => setEditingAccount(null)} 
          onSave={saveAccount} 
        />
      )}

      {/* Role Management Modal */}
      {showRoleManager && (
        <RoleManager 
          accounts={profiles} 
          roles={roles}
          onRefresh={fetchRoles}
          onClose={() => setShowRoleManager(false)} 
        />
      )}
      {/* Tab 4: Tích hợp */}
      {activeTab === 'integrations' && (
        <IntegrationsTab />
      )}
    </div>
  );
}

function BranchForm({ branch, onClose, onSave }) {
  const t = useT();
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'working_time'
  
  const [f, setF] = useState({
    name: branch.name || '',
    address: branch.address || '',
    phone: branch.phone || '',
    city: branch.city || '',
    state: branch.state || '',
    post_code: branch.post_code || '',
    country: branch.country || 'Vietnam',
    tax_code: branch.tax_code || '',
    logo_url: branch.logo_url || '',
    google_map: branch.google_map || '',
    youtube: branch.youtube || '',
    facebook: branch.facebook || '',
    instagram: branch.instagram || '',
    timezone: branch.timezone || 'GMT+07:00',
    date_format: branch.date_format || 'dd/MM/yyyy',
    currency: branch.currency || 'VND',
    language: branch.language || 'vi',
    manager_name: branch.manager_name || '',
    working_hours: branch.working_hours || [
      { day: 'Thứ 2', key: 'mon', enabled: true, open: '08:00', close: '20:00' },
      { day: 'Thứ 3', key: 'tue', enabled: true, open: '08:00', close: '20:00' },
      { day: 'Thứ 4', key: 'wed', enabled: true, open: '08:00', close: '20:00' },
      { day: 'Thứ 5', key: 'thu', enabled: true, open: '08:00', close: '20:00' },
      { day: 'Thứ 6', key: 'fri', enabled: true, open: '08:00', close: '20:00' },
      { day: 'Thứ 7', key: 'sat', enabled: true, open: '08:00', close: '20:00' },
      { day: 'Chủ Nhật', key: 'sun', enabled: true, open: '08:00', close: '20:00' }
    ]
  });

  const handleWorkingHourChange = (idx, key, val) => {
    setF(prev => {
      const updated = [...prev.working_hours];
      updated[idx] = { ...updated[idx], [key]: val };
      return { ...prev, working_hours: updated };
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl transition-all flex flex-col max-h-[92vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{t('settings.branch_modal_title', 'Cấu hình Chi nhánh')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50 shrink-0">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all ${
              activeSubTab === 'general' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('settings.branch_modal_subtab_general', 'Thông tin chung')}
          </button>
          <button
            onClick={() => setActiveSubTab('working_time')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all ${
              activeSubTab === 'working_time' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('settings.branch_modal_subtab_working_time', 'Giờ hoạt động')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/30 flex-1 space-y-6">
          {activeSubTab === 'general' ? (
            <div className="space-y-6">
              {/* Logo & Profile */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-left">{t('settings.branch_modal_profile_header', 'HỒ SƠ CHI NHÁNH')}</h3>
                
                {/* Logo section */}
                <div className="pb-2">
                  <ImageUpload 
                    value={f.logo_url} 
                    onChange={(v) => setF({ ...f, logo_url: v })} 
                    label={t('settings.branch_modal_logo_label', 'Logo chi nhánh (hiển thị trên website đặt lịch & hoá đơn giao dịch)')}
                    shape="square" 
                  />
                </div>

                {/* Profile fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_name_label', 'Tên chi nhánh')} <span className="text-red-500">*</span></label>
                    <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t('settings.branch_modal_name_ph', 'Nhập tên chi nhánh...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_country_label', 'Quốc gia')} <span className="text-red-500">*</span></label>
                    <select value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value="Vietnam">{t('settings.branch_modal_country_vn', 'Việt Nam')}</option>
                      <option value="United States">{t('settings.branch_modal_country_us', 'Mỹ (United States)')}</option>
                      <option value="Singapore">{t('settings.branch_modal_country_sg', 'Singapore')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_city_label', 'Thành phố / Quận huyện')} <span className="text-red-500">*</span></label>
                    <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder={t('settings.branch_modal_city_ph', 'Nhập thành phố hoặc quận huyện...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_state_label', 'Tỉnh / Bang')} <span className="text-red-500">*</span></label>
                    <input value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} placeholder={t('settings.branch_modal_state_ph', 'Nhập tỉnh hoặc bang...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_post_code_label', 'Mã bưu điện')} <span className="text-red-500">*</span></label>
                    <input value={f.post_code} onChange={(e) => setF({ ...f, post_code: e.target.value })} placeholder={t('settings.branch_modal_post_code_ph', 'Ví dụ: 70000')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_phone_label', 'Số điện thoại')}</label>
                    <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder={t('settings.branch_modal_phone_ph', 'Nhập số điện thoại chi nhánh...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_address_label', 'Địa chỉ chi tiết')} <span className="text-red-500">*</span></label>
                    <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder={t('settings.branch_modal_address_ph', 'Số nhà, tên đường...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_tax_code_label', 'Mã số thuế')}</label>
                    <input value={f.tax_code} onChange={(e) => setF({ ...f, tax_code: e.target.value })} placeholder={t('settings.branch_modal_tax_code_ph', 'Nhập mã số thuế...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-left">{t('settings.branch_modal_social_header', 'MẠNG XÃ HỘI')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Google Map</label>
                    <input value={f.google_map} onChange={(e) => setF({ ...f, google_map: e.target.value })} placeholder={t('settings.branch_modal_gmap_ph', 'Đường dẫn Google Map...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Youtube</label>
                    <input value={f.youtube} onChange={(e) => setF({ ...f, youtube: e.target.value })} placeholder={t('settings.branch_modal_youtube_ph', 'Đường dẫn kênh Youtube...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Facebook</label>
                    <input value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} placeholder={t('settings.branch_modal_fb_ph', 'Đường dẫn trang Facebook...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Instagram</label>
                    <input value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} placeholder={t('settings.branch_modal_insta_ph', 'Đường dẫn trang Instagram...')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Organization Format */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-left">{t('settings.branch_modal_format_header', 'ĐỊNH DẠNG HIỂN THỊ')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_timezone_label', 'Múi giờ')} <span className="text-red-500">*</span></label>
                    <select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value="GMT+07:00">(GMT+07:00) Hà Nội, Băng Cốc</option>
                      <option value="GMT-06:00">(GMT-06:00) Trung Mỹ</option>
                      <option value="GMT+08:00">(GMT+08:00) Singapore, Bắc Kinh</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_date_format_label', 'Định dạng ngày')}</label>
                    <select value={f.date_format} onChange={(e) => setF({ ...f, date_format: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                      <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                      <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_currency_label', 'Đơn vị tiền tệ')}</label>
                    <select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value="VND">VND - Việt Nam Đồng</option>
                      <option value="USD">USD - Đô la Mỹ</option>
                      <option value="SGD">SGD - Đô la Singapore</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{t('settings.branch_modal_lang_label', 'Ngôn ngữ hiển thị')}</label>
                    <select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">Tiếng Anh (English)</option>
                      <option value="zh">Tiếng Trung (Chinese)</option>
                      <option value="ko">Tiếng Hàn (Korean)</option>
                      <option value="ja">Tiếng Nhật (Japanese)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Working Time Tab */
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider text-left">{t('settings.branch_modal_working_hours_header', 'GIỜ HOẠT ĐỘNG CHI NHÁNH')}</h3>
              <p className="text-xs text-slate-400">{t('settings.branch_modal_working_hours_desc', 'Thiết lập khung giờ làm việc mở cửa và đóng cửa cho các ngày trong tuần.')}</p>
              
              <div className="space-y-3">
                {f.working_hours.map((wh, idx) => {
                  const dayKeyMap = {
                    'Thứ 2': 'mon', 'Thứ 3': 'tue', 'Thứ 4': 'wed', 'Thứ 5': 'thu', 'Thứ 6': 'fri', 'Thứ 7': 'sat', 'Chủ Nhật': 'sun'
                  };
                  const dayKey = wh.key || dayKeyMap[wh.day] || 'mon';
                  const translatedDay = t('settings.day_' + dayKey, wh.day);

                  return (
                    <div key={wh.day} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wh.enabled}
                          onChange={(e) => handleWorkingHourChange(idx, 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-350 focus:ring-emerald-500"
                        />
                        <span className="font-bold text-slate-700 text-sm w-24">{translatedDay}</span>
                      </label>

                      {wh.enabled ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={wh.open}
                            onChange={(e) => handleWorkingHourChange(idx, 'open', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                          />
                          <span className="text-slate-400 text-xs">-</span>
                          <input
                            type="time"
                            value={wh.close}
                            onChange={(e) => handleWorkingHourChange(idx, 'close', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-semibold px-3 py-1 bg-red-50 rounded-lg">{t('settings.branch_modal_closed', 'Đóng cửa')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end bg-white shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm transition-all border border-slate-100">
            {t('settings.btn_cancel', 'Hủy')}
          </button>
          <button 
            onClick={() => {
              if (!f.name || !f.country || !f.city || !f.state || !f.post_code || !f.address) {
                return toast.error(t('settings.fill_required_error', 'Vui lòng nhập đầy đủ các trường bắt buộc (*)'));
              }
              onSave(f);
            }} 
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm active:scale-95"
          >
            {t('settings.btn_save', 'Lưu')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AccountForm({ account, branches, roles = [], isFirst, onClose, onSave }) {
  const t = useT();
  const [f, setF] = useState({
    avatar_url: account.avatar_url || '',
    first_name: account.first_name || '',
    last_name: account.last_name || '',
    email: account.email || '',
    phone: account.phone || '',
    role: isFirst ? 'owner' : (account.role || 'cashier'),
    type: account.type || 'Employee',
    status: account.status || 'active',
    branch_ids: account.branch_ids || (account.branch_id ? [account.branch_id] : [])
  });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-bold text-slate-800 font-body">
            {account.id ? t('settings.edit_account_title', 'Sửa thông tin tài khoản') : t('settings.btn_add_account', 'Thêm tài khoản')}
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-3 flex-1 pb-4">
          {/* Avatar Upload */}
          <div className="flex justify-center pb-2">
            <ImageUpload 
              value={f.avatar_url} 
              onChange={(v) => setF({ ...f, avatar_url: v })} 
              shape="circle" 
            />
          </div>

          {isFirst && (
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-2 text-[11px] text-amber-700">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{t('settings.account_modal_first_owner_note', 'Tài khoản đầu tiên mặc định giữ vai trò Chủ Salon (Owner) và có toàn quyền quản trị tối cao.')}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('settings.account_modal_first_name_label', 'Tên')} *</label>
              <input 
                value={f.first_name} 
                onChange={(e) => setF({ ...f, first_name: e.target.value })} 
                placeholder={t('settings.account_modal_first_name_label', 'Tên')} 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 text-slate-700 bg-white" 
              />
            </div>
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('settings.account_modal_last_name_label', 'Họ & Tên đệm')}</label>
              <input 
                value={f.last_name} 
                onChange={(e) => setF({ ...f, last_name: e.target.value })} 
                placeholder={t('settings.account_modal_last_name_label', 'Họ')} 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 text-slate-700 bg-white" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('settings.account_modal_phone_label', 'Số điện thoại')}</label>
              <input 
                value={f.phone} 
                onChange={(e) => setF({ ...f, phone: e.target.value })} 
                placeholder={t('settings.account_modal_phone_label', 'Số điện thoại')} 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 text-slate-700 bg-white" 
              />
            </div>
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('settings.account_modal_email_label', 'Email')} *</label>
              <input 
                value={f.email} 
                disabled={!!account.id}
                onChange={(e) => setF({ ...f, email: e.target.value })} 
                placeholder="nhanvien@salon.com" 
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-400" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('settings.account_modal_type_label', 'Phân loại')} *</label>
              <select
                value={f.type}
                onChange={(e) => setF({ ...f, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 text-slate-700 bg-white appearance-none cursor-pointer"
              >
                <option value="Employee">{t('settings.type_employee', 'Nhân viên')}</option>
                <option value="User">{t('settings.type_user', 'Khách hàng (User)')}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('settings.account_modal_status_label', 'Trạng thái')}</label>
              <select
                value={f.status}
                onChange={(e) => setF({ ...f, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 text-slate-700 bg-white appearance-none cursor-pointer"
              >
                <option value="active">{t('settings.status_active', 'Hoạt động')}</option>
                <option value="pending">{t('settings.status_pending', 'Chờ kích hoạt')}</option>
                <option value="inactive">{t('settings.status_disabled', 'Vô hiệu hóa')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('settings.account_modal_system_role_label', 'Vai trò hệ thống')} *</label>
            <select
              value={f.role}
              disabled={isFirst}
              onChange={(e) => setF({ ...f, role: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 text-slate-700 bg-white appearance-none cursor-pointer"
            >
              {(roles.length > 0 ? roles : [
                { code: 'owner', name: 'Chủ Salon (Owner)' },
                { code: 'admin', name: 'Quản trị viên (Admin)' },
                { code: 'cashier', name: 'Thu ngân' }
              ]).map(r => (
                <option key={r.code} value={r.code}>{t('settings.role_' + r.code, r.name)}</option>
              ))}
            </select>
          </div>

          {f.role !== 'owner' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="block font-medium text-slate-700 mb-2 text-xs">{t('settings.account_modal_branches_label', 'Chi nhánh hoạt động')} *</label>
              <div className="flex flex-wrap gap-3">
                {branches.length === 0 ? (
                  <span className="text-xs text-slate-400">{t('settings.account_modal_no_branches', 'Không tìm thấy chi nhánh')}</span>
                ) : (
                  branches.map(b => {
                    const isChecked = f.branch_ids.includes(b.id);
                    return (
                      <label key={b.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            setF(prev => {
                              const ids = prev.branch_ids.includes(b.id)
                                ? prev.branch_ids.filter(id => id !== b.id)
                                : [...prev.branch_ids, b.id];
                              return { ...prev, branch_ids: ids };
                            });
                          }}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <span className="text-xs text-slate-600">{b.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-body"
          >
            {t('settings.btn_cancel', 'Hủy')}
          </button>
          <button 
            onClick={() => {
              if (!f.email || !f.first_name) {
                return toast.error(t('settings.fill_email_name_error', 'Vui lòng điền đầy đủ Email và Tên'));
              }
              if (f.role !== 'owner' && f.branch_ids.length === 0) {
                return toast.error(t('settings.select_branch_error', 'Vui lòng chọn ít nhất một chi nhánh hoạt động'));
              }
              const fullName = `${f.last_name} ${f.first_name}`.trim();
              onSave({
                ...f,
                full_name: fullName
              });
            }} 
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all font-body"
          >
            {t('settings.btn_save', 'Lưu')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
