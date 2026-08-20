import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, X, BarChart3, QrCode, CheckCircle2, Sparkles, Smile, Check } from 'lucide-react';
import { applyDiscountsToCart } from '@/utils/promos';
import { useRouter, useSearchParams } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { useBranch } from '@/lib/BranchContext';
import { todayStr, formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { loadCustomerTiers } from '@/utils/loyaltyFallbacks';
import { createIncomeVoucher } from '@/lib/cashFlowHelper';
import CatalogColumn from '@/components/pos/CatalogColumn';
import { getNormalizedLogs, createLogEntry } from '@/lib/logHelper';
import { useT } from '@/lib/i18n';

const getCurrentUser = () => {
  try {
    const local = localStorage.getItem('user');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.name) return parsed.name;
    }
  } catch (e) {}
  return 'Lễ tân';
};
import TicketColumn from '@/components/pos/TicketColumn';
import CheckoutModal from '@/components/pos/CheckoutModal';
import NewCustomerModal from '@/components/pos/NewCustomerModal';
import EmptyCart from '@/components/pos/EmptyCart';
import Avatar from '@/components/Avatar';

let seqCounter = 1;

const newSession = () => {
  const seq = seqCounter++;
  return {
    id: Date.now().toString() + seq,
    saleCode: 'SC' + String(Math.floor(100000 + Math.random() * 900000)),
    seqNum: seq,
    customer: null,
    cart: [],
    discount: 0,
    discountType: 'vnd',
    discountValue: 0,
    tip: 0,
    tipSplits: [],
    reviewStatus: 'unreviewed', // 'unreviewed' | 'reviewing' | 'done'
    reviewData: null,
    promo: null,
    voucher: null,
    logs: [
      {
        id: Date.now().toString(),
        action: 'Tạo đơn hàng',
        details: 'Khởi tạo đơn hàng mới',
        user: getCurrentUser(),
        time: new Date()
      }
    ],
    createdAt: new Date()
  };
};
const tabName = (s) => {
  if (s.customer) {
    const first = s.customer.name.split(' ').slice(-1)[0] || s.customer.name;
    return `${first}-${String(s.seqNum).padStart(3, '0')}`;
  }
  return `Walk-In-${String(s.seqNum).padStart(3, '0')}`;
};

// Cache catalog data in-memory to avoid repeated fetches (2-minute TTL) across unmounts
let globalCatalogCache = null;
let globalCatalogCacheTime = 0;
const CATALOG_TTL_MS = 2 * 60 * 1000; // 2 minutes

let globalCustomerCache = null;
let globalCustomerCacheTime = 0;
const CUSTOMER_TTL_MS = 30 * 1000; // 30 seconds

export default function POS() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBranchId } = useBranch();
  const { t } = useT();

  const clearSearchParams = (keys) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    keys.forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, '', url.pathname + url.search);
  };
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const editInvoiceId = searchParams.get('edit_invoice_id');

  const loadUnpaidInvoices = async (selectId = null) => {
    try {
      // Reuse in-memory catalog if available, otherwise fetch only unpaid invoices + customers
      let catData = globalCatalogCache;
      
      const now = Date.now();
      const customerPromise = (globalCustomerCache && (now - globalCustomerCacheTime) < CUSTOMER_TTL_MS)
        ? Promise.resolve(globalCustomerCache)
        : base44.entities.Customer.list().then(c => {
            globalCustomerCache = c;
            globalCustomerCacheTime = Date.now();
            return c;
          });

      const [invs, cusList] = await Promise.all([
        base44.entities.Invoice.filter({ status: 'unpaid' }),
        customerPromise
      ]);

      // Build allCat from cache or current state refs
      const allCat = catData
        ? [...(catData.s||[]), ...(catData.p||[]), ...(catData.pk||[]), ...(catData.t||[]), ...(catData.sc||[]), ...(catData.pc||[]), ...(catData.gc||[])]
        : [];
      const branchInvs = (currentBranchId === 'all' || !currentBranchId)
        ? invs
        : invs.filter(x => String(x.branch_id) === String(currentBranchId));
      const unpaidInvs = branchInvs;
      const cusMap = Object.fromEntries(cusList.map(c => [c.id, c]));
      const sorted = unpaidInvs.sort((a, b) => (a.invoice_code || '').localeCompare(b.invoice_code || ''));
      const mapped = sorted.map((inv, idx) => {
        let cObj = inv.customer_id ? (cusMap[inv.customer_id] || cusList.find(c => c && String(c.id) === String(inv.customer_id))) : null;
        let resolvedCustomer = null;
        if (cObj) {
          resolvedCustomer = {
            id: cObj.id,
            name: cObj.name,
            avatar_url: cObj.avatar_url,
            phone: cObj.phone || '',
            points: cObj.points || 0,
            total_spent: cObj.total_spent || 0
          };
        } else if (inv.customer_name && inv.customer_name !== 'Khách vãng lai') {
          resolvedCustomer = {
            id: inv.customer_id || null,
            name: inv.customer_name,
            phone: '',
            points: 0,
            total_spent: 0
          };
        } else {
          resolvedCustomer = null;
        }

        return {
          id: inv.id,
          seqNum: idx + 1,
          saleCode: inv.invoice_code,
          customer: resolvedCustomer,
          cart: (inv.items || []).map(x => {
            const match = allCat.find(cat => cat && (cat.name === x.name || String(cat.id) === String(x.id)));
            return {
              id: x.id || Math.random().toString(),
              name: x.name,
              type: x.type || 'service',
              price: x.price || 0,
              originalPrice: x.price || 0,
              qty: x.qty || 1,
              staff_id: x.staff_id || '',
              staff_name: x.staff_name || '',
              is_customer_requested: !!x.is_customer_requested,
              is_from_package: !!x.is_from_package,
              package_name: x.package_name || '',
              customer_package_id: x.customer_package_id || '',
              customer_treatment_id: x.customer_treatment_id || '',
              balance: x.balance || 0,
              sessions: x.sessions || 10,
              image_url: x.image_url || x.image || (match ? (match.image_url || match.image || '') : ''),
              color: x.color || (match ? (match.color || '') : '')
            };
          }),
          discountValue: inv.discount_amount || inv.discount || 0,
          discountType: inv.discount_type || 'vnd',
          tip: inv.tip || 0,
          tipSplits: (inv.tip_splits || []).map(ts => ({ staffId: ts.staff_id, amount: ts.amount })),
          reviewStatus: inv.review_data?.status || (inv.tip > 0 ? 'done' : 'unreviewed'),
          reviewData: inv.review_data || null,
          isRestoredFromInvoice: true,
          logs: getNormalizedLogs(inv)
        };
      });
      setSessions(mapped);
      if (selectId) {
        setActiveId(selectId);
      } else if (mapped.length > 0) {
        setActiveId(mapped[0].id);
      } else {
        setActiveId(null);
      }
    } catch (err) {
      console.error('Lỗi khi tải hóa đơn tạm tính:', err);
    }
  };

  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [serviceCombos, setServiceCombos] = useState([]);
  const [productCombos, setProductCombos] = useState([]);
  const [prepaidCards, setPrepaidCards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalogTab, setCatalogTab] = useState('service');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [custModal, setCustModal] = useState(false);
  const [custQuery, setCustQuery] = useState('');
  const [paying, setPaying] = useState(false);
  const [customerTiers, setCustomerTiers] = useState([]);

  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  const loadData = (forceRefresh = false) => {
    const now = Date.now();
    const cacheValid = globalCatalogCache && (now - globalCatalogCacheTime) < CATALOG_TTL_MS;

    setIsLoadingCatalog(true);
    const catalogFilter = currentBranchId === 'all' ? {} : { branch_ids: currentBranchId };
    const normalFilter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };

    // If catalog cache is valid and not forced, skip heavy catalog fetches
    const catalogPromise = (!forceRefresh && cacheValid)
      ? Promise.resolve(globalCatalogCache)
      : Promise.all([
          base44.entities.Service.filter(catalogFilter),
          base44.entities.Product.filter(catalogFilter),
          base44.entities.ServicePackage.filter(catalogFilter),
          base44.entities.Treatment.filter(catalogFilter),
          base44.entities.ServiceCombo.filter(catalogFilter),
          base44.entities.ProductCombo.filter(catalogFilter),
          base44.entities.PrepaidCard.filter(catalogFilter),
        ]).then(([s, p, pk, t, sc, pc, gc]) => {
          const data = { s, p, pk, t, sc, pc, gc };
          globalCatalogCache = data;
          globalCatalogCacheTime = Date.now();
          return data;
        });

    const customerPromise = (globalCustomerCache && (now - globalCustomerCacheTime) < CUSTOMER_TTL_MS)
      ? Promise.resolve(globalCustomerCache)
      : base44.entities.Customer.list().then(c => {
          globalCustomerCache = c;
          globalCustomerCacheTime = Date.now();
          return c;
        });

    Promise.all([
      catalogPromise,
      base44.entities.ServiceGroup.filter(normalFilter),
      base44.entities.Staff.filter(normalFilter),
      customerPromise,
      loadCustomerTiers()
    ]).then(([catData, gr, st, c, ct]) => {
      const { s, p, pk, t, sc, pc, gc } = catData;
      setServices((s || []).filter((x) => x.is_active));
      setProducts((p || []).filter((x) => x.is_active));
      setPackages((pk || []).filter((x) => x.is_active));
      setTreatments((t || []).filter((x) => x.is_active));
      setServiceCombos((sc || []).filter((x) => x.is_active));
      setProductCombos((pc || []).filter((x) => x.is_active));
      setPrepaidCards((gc || []).filter((x) => x.is_active));
      setGroups(gr || []);
      setStaff((st || []).filter((x) => x.is_active !== false));
      setCustomers(c || []);
      setCustomerTiers(ct || []);

      const allCat = [...(s||[]), ...(p||[]), ...(pk||[]), ...(t||[]), ...(sc||[]), ...(pc||[]), ...(gc||[])];
      setSessions(prev => (prev || []).map(sess => ({
        ...sess,
        cart: (sess.cart || []).map(item => {
          const match = allCat.find(cat => cat && (cat.name === item.name || String(cat.id) === String(item.id)));
          return {
            ...item,
            image_url: item.image_url || (match ? (match.image_url || match.image || '') : ''),
            color: item.color || (match ? (match.color || '') : '')
          };
        })
      })));
      setIsLoadingCatalog(false);
    }).catch(err => {
      console.error('[loadData] error:', err);
      setIsLoadingCatalog(false);
    });
  };

  useEffect(() => {
    loadData();
    
    const buyAgainCustomerId = searchParams.get('buy_again_customer_id');
    const buyAgainName = searchParams.get('buy_again_name');
    const buyAgainType = searchParams.get('buy_again_type');
    const buyAgainPrice = parseFloat(searchParams.get('buy_again_price') || '0');
    const prefillCustomerId = searchParams.get('customer_id');

    if (prefillCustomerId) {
      base44.entities.Customer.list().then(cusList => {
        const custObj = cusList.find(c => c && String(c.id) === String(prefillCustomerId));
        if (custObj) {
          handleUpdateSession({ customer: custObj });
        }
      });
    }

    if (buyAgainCustomerId && buyAgainName && buyAgainType) {
      if (currentBranchId === 'all' || !currentBranchId) {
        toast.error(t('pos.err_select_branch_buy_again', 'Vui lòng chọn cơ sở cụ thể để mua lại dịch vụ/sản phẩm'));
        return;
      }
      Promise.all([
        base44.entities.Customer.list(),
        base44.entities.Invoice.list()
      ]).then(async ([cusList, allInvs]) => {
        const custObj = cusList.find(c => c && String(c.id) === String(buyAgainCustomerId));
        const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
        
        let dbType = buyAgainType;
        if (dbType !== 'service' && dbType !== 'product') {
          dbType = 'package';
        }

        try {
          const newInv = await base44.entities.Invoice.create({
            invoice_code: saleCode,
            customer_name: custObj?.name || 'Khách vãng lai',
            customer_id: custObj?.id || '',
            branch_id: (currentBranchId === 'all' || !currentBranchId) ? '' : currentBranchId,
            items: [{
              name: buyAgainName,
              type: dbType,
              price: buyAgainPrice,
              qty: 1,
              staff_id: '',
              staff_name: '',
              is_customer_requested: false
            }],
            subtotal: buyAgainPrice,
            discount: 0,
            total: buyAgainPrice,
            tip: 0,
            status: 'unpaid',
            date: todayStr()
          });

          await loadUnpaidInvoices(newInv.id);
          toast.success(`${t('pos.toast_buy_again_created', 'Đã tạo đơn mua lại cho khách')} ${custObj?.name || ''}`);
        } catch (e) {
          toast.error(t('pos.err_create_buyagain_invoice', 'Lỗi khi tạo hóa đơn mua lại: ') + (e.message || e));
          loadUnpaidInvoices();
        }

        // Clean query params
        clearSearchParams(['buy_again_customer_id', 'buy_again_name', 'buy_again_type', 'buy_again_price']);
      });
    } else {
      loadUnpaidInvoices(editInvoiceId).then(() => {
        if (editInvoiceId) {
          clearSearchParams(['edit_invoice_id']);
        }
      });
    }
  }, [currentBranchId]);

  useEffect(() => {
    const handleReload = () => {
      loadData(true);
      loadUnpaidInvoices(activeId);
    };
    window.addEventListener('reload-data', handleReload);
    return () => window.removeEventListener('reload-data', handleReload);
  }, [activeId]);

  // Realtime review synchronization across browser tabs and mobile phones
  useEffect(() => {
    // 1. LocalStorage listener
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('glopro_review_') && e.newValue) {
        try {
          const sId = e.key.replace('glopro_review_', '');
          const data = JSON.parse(e.newValue);
          setSessions(prev => (prev || []).map(s => {
            if (s.id === sId) {
              const updated = {
                ...s,
                reviewStatus: data.status,
                reviewData: data
              };
              if (data.status === 'done' && data.tip !== undefined) {
                updated.tip = data.tip;
                if (data.tipSplits && data.tipSplits.length > 0) {
                  updated.tipSplits = data.tipSplits;
                }
              }
              if (data.status === 'done' && data.customerInfo && data.customerInfo.name) {
                updated.customer = {
                  id: data.customerInfo.id || 'cust_' + Date.now(),
                  name: data.customerInfo.name,
                  phone: data.customerInfo.phone,
                  email: data.customerInfo.email,
                  dob: data.customerInfo.dob,
                  birthday: data.customerInfo.dob
                };
              }
              syncSessionToDb(updated);
              return updated;
            }
            return s;
          }));
        } catch (err) {
          console.error('[Review Storage Listener Error]:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 2. Supabase Realtime Channels for each session
    if (sessions && sessions.length > 0) {
      const channels = sessions.map(s => {
        const channel = supabase.channel(`glopro_review_${s.id}`)
          .on('broadcast', { event: 'status_change' }, (payload) => {
            if (payload?.payload) {
              const data = payload.payload;
              setSessions(prev => (prev || []).map(item => {
                if (item.id === s.id) {
                  const updated = {
                    ...item,
                    reviewStatus: data.status,
                    reviewData: data
                  };
                  if (data.status === 'done' && data.tip !== undefined) {
                    updated.tip = data.tip;
                    if (data.tipSplits && data.tipSplits.length > 0) {
                      updated.tipSplits = data.tipSplits;
                    }
                  }
                  if (data.status === 'done' && data.customerInfo && data.customerInfo.name) {
                    updated.customer = {
                      id: data.customerInfo.id || 'cust_' + Date.now(),
                      name: data.customerInfo.name,
                      phone: data.customerInfo.phone,
                      email: data.customerInfo.email,
                      dob: data.customerInfo.dob,
                      birthday: data.customerInfo.dob
                    };
                  }
                  syncSessionToDb(updated);
                  return updated;
                }
                return item;
              }));
            }
          })
          .subscribe();
        return channel;
      });

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        channels.forEach(ch => supabase.removeChannel(ch));
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sessions.map(s => s.id).join(',')]);

  const activeSession = sessions.find((s) => s.id === activeId);

  const syncSessionToDb = async (updatedSession) => {
    if (!updatedSession || !updatedSession.id || String(updatedSession.id).startsWith('direct_pos_')) return;
    const cart = updatedSession.cart || [];
    const subtotal = cart.reduce((sum, x) => sum + (x.price || 0) * (x.qty || 1), 0);
    const discount = updatedSession.discountType === 'percent' ? Math.round(subtotal * ((updatedSession.discountValue || 0) / 100)) : (updatedSession.discountValue || 0);
    const total = Math.max(0, subtotal - discount) + (updatedSession.tip || 0);

    try {
      await base44.entities.Invoice.update(updatedSession.id, {
        invoice_code: updatedSession.saleCode || ('SC' + String(Math.floor(100000 + Math.random() * 900000))),
        customer_id: updatedSession.customer?.id || '',
        customer_name: (updatedSession.customer?.name && updatedSession.customer.name.trim()) ? updatedSession.customer.name.trim() : 'Khách vãng lai',
        items: cart.map((x) => {
          let dbType = x.type;
          if (dbType !== 'service' && dbType !== 'product') {
            dbType = 'package';
          }
          return { 
            name: x.name, 
            type: dbType, 
            price: Math.round(x.price || 0), 
            qty: Math.round(x.qty || 1), 
            staff_id: x.staff_id || '', 
            staff_name: x.staff_name || '',
            is_customer_requested: !!x.is_customer_requested,
            is_from_package: !!x.is_from_package,
            package_name: x.package_name || '',
            customer_package_id: x.customer_package_id || null,
            customer_treatment_id: x.customer_treatment_id || null,
            balance: Math.round(x.balance || 0),
            sessions: Math.round(x.sessions || 10),
            image_url: x.image_url || x.image || '',
            color: x.color || ''
          };
        }),
        subtotal: Math.round(subtotal),
        discount: Math.round(discount),
        total: Math.round(total),
        tip: Math.round(updatedSession.tip || 0),
        tip_splits: (updatedSession.tipSplits || []).map(s => ({ staff_id: s.staffId, amount: Math.round(s.amount || 0) })),
        logs: JSON.stringify(updatedSession.logs || [])
      });
    } catch (err) {
      console.error('Failed to sync session updates to DB:', err);
    }
  };

  const patchSession = (patch) => {
    if (!activeId) return;
    const currentSession = sessions.find((s) => s.id === activeId);
    if (!currentSession) return;

    let logs = getNormalizedLogs(currentSession);
    const createEntry = (action, details) => createLogEntry(action, details, getCurrentUser());

    // Detect customer changes
    if ('customer' in patch) {
      if (patch.customer) {
        logs = [...logs, createEntry('Chọn khách hàng', patch.customer.name)];
        // Find customer tier and auto apply discount
        const cust = patch.customer;
        const sortedTiers = [...customerTiers].sort((a, b) => b.min_spend - a.min_spend);
        const tier = sortedTiers.find(t => (cust.total_spent || 0) >= t.min_spend || (cust.points || 0) >= t.min_points);
        if (tier) {
          if (tier.discount_percent > 0) {
            patch.discountType = 'percent';
            patch.discountValue = tier.discount_percent;
          } else if (tier.discount_amount > 0) {
            patch.discountType = 'vnd';
            patch.discountValue = tier.discount_amount;
          }
        }
      } else if (currentSession.customer) {
        logs = [...logs, createEntry('Bỏ chọn khách hàng', currentSession.customer.name)];
        // Reset default discount
        patch.discountType = 'vnd';
        patch.discountValue = 0;
      }
    }

    // Detect discount changes
    if ('discount' in patch && patch.discount !== currentSession.discount) {
      logs = [...logs, createEntry('Thay đổi giảm giá hóa đơn', `${formatVND(currentSession.discount)} -> ${formatVND(patch.discount)}`)];
    }

    // Detect promo changes
    if ('promo' in patch) {
      if (patch.promo) {
        logs = [...logs, createEntry('Áp dụng CTKM', patch.promo.name)];
      } else if (currentSession.promo) {
        logs = [...logs, createEntry('Hủy áp dụng CTKM', currentSession.promo.name)];
      }
    }

    // Detect voucher changes
    if ('voucher' in patch) {
      if (patch.voucher) {
        logs = [...logs, createEntry('Áp dụng Voucher', patch.voucher.name)];
      } else if (currentSession.voucher) {
        logs = [...logs, createEntry('Hủy áp dụng Voucher', currentSession.voucher.name)];
      }
    }

    // Detect item deletion or cart edits
    if ('cart' in patch) {
      const currentCart = currentSession.cart || [];
      const patchCart = patch.cart || [];

      if (patchCart.length > currentCart.length) {
        const addedItems = patchCart.filter(x => !currentCart.some(y => y.id === x.id || (y.name === x.name && y.type === x.type)));
        if (addedItems.length > 0) {
          const processedPackages = new Set();
          addedItems.forEach(added => {
            if (added.is_from_package && added.package_name) {
              if (!processedPackages.has(added.package_name)) {
                const actionLabel = added.customer_treatment_id ? 'Sử dụng liệu trình' : 'Sử dụng gói';
                logs = [...logs, createEntry(actionLabel, added.package_name)];
                processedPackages.add(added.package_name);
              }
            } else {
              logs = [...logs, createEntry('Thêm vào giỏ hàng', `${added.name} (${added.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'})`)];
            }
          });
        }
      } else if (patchCart.length < currentCart.length) {
        // Item removed
        const removedItems = currentCart.filter(x => !patchCart.some(y => y.id === x.id || (y.name === x.name && y.type === x.type)));
        if (removedItems.length > 0) {
          const processedPackages = new Set();
          removedItems.forEach(removed => {
            if (removed.is_from_package && removed.package_name) {
              if (!processedPackages.has(removed.package_name)) {
                const actionLabel = removed.customer_treatment_id ? 'Xóa liệu trình' : 'Xóa gói';
                logs = [...logs, createEntry(actionLabel, removed.package_name)];
                processedPackages.add(removed.package_name);
              }
            } else {
              logs = [...logs, createEntry('Xóa khỏi giỏ hàng', `${removed.name} (x${removed.qty})`)];
            }
          });
        }
      } else if (patchCart.length === currentCart.length) {
        // Item qty, price, or staff updated
        const processedPackageQtyChanges = new Set();
        
        currentCart.forEach((x, idx) => {
          const y = patchCart[idx];
          if (!y) return;
          
          if (y.qty !== x.qty || y.price !== x.price || y.staff_id !== x.staff_id) {
            if (x.is_from_package && x.package_name) {
              const packageTypeLabel = x.customer_treatment_id ? 'liệu trình' : 'gói';
              const capitalizedPackageTypeLabel = x.customer_treatment_id ? 'Liệu trình' : 'Gói';
              if (y.qty !== x.qty) {
                if (!processedPackageQtyChanges.has(x.package_name)) {
                  logs = [...logs, createEntry(`Thay đổi số lượng ${packageTypeLabel} ${x.package_name}`, `${x.qty} -> ${y.qty}`)];
                  processedPackageQtyChanges.add(x.package_name);
                }
              } else {
                const changes = [];
                if (y.price !== x.price) changes.push(`Giá bán: ${formatVND(x.price)} -> ${formatVND(y.price)}`);
                if (y.staff_id !== x.staff_id) changes.push(`Nhân viên: ${x.staff_name || 'Chưa chọn'} -> ${y.staff_name || 'Chưa chọn'}`);
                if (changes.length > 0) {
                  logs = [...logs, createEntry(`Chỉnh sửa ${x.name} (${capitalizedPackageTypeLabel} ${x.package_name})`, changes.join(', '))];
                }
              }
            } else {
              const changes = [];
              if (y.qty !== x.qty) changes.push(`Số lượng: ${x.qty} -> ${y.qty}`);
              if (y.price !== x.price) changes.push(`Giá bán: ${formatVND(x.price)} -> ${formatVND(y.price)}`);
              if (y.staff_id !== x.staff_id) changes.push(`Nhân viên: ${x.staff_name || 'Chưa chọn'} -> ${y.staff_name || 'Chưa chọn'}`);
              logs = [...logs, createEntry(`Chỉnh sửa ${x.name}`, changes.join(', '))];
            }
          }
        });
      }
    }

    const updatedSession = { ...currentSession, ...patch, logs };

    setSessions((arr) => arr.map((s) => (s.id === activeId ? updatedSession : s)));
    syncSessionToDb(updatedSession);
  };

  const createSale = async () => {
    if (currentBranchId === 'all' || !currentBranchId) {
      return toast.error(t('pos.err_select_branch_create', 'Vui lòng chọn một cơ sở cụ thể ở góc trên bên trái để tạo đơn hàng'));
    }

    try {
      const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
      const initialLog = createLogEntry(`Tạo hoá đơn #${saleCode}`, 'Khởi tạo hoá đơn cho Khách vãng lai', 'Lễ tân');
      
      const newInv = await base44.entities.Invoice.create({
        invoice_code: saleCode,
        customer_name: 'Khách vãng lai',
        customer_id: '',
        branch_id: currentBranchId,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        tip: 0,
        status: 'unpaid',
        date: todayStr(),
        logs: JSON.stringify([initialLog])
      });

      await loadUnpaidInvoices(newInv.id);
      toast.success(`${t('pos.toast_invoice_created', 'Đã tạo hóa đơn tạm tính mới')} • ${saleCode}`);
    } catch (e) {
      toast.error(t('pos.err_create_invoice', 'Lỗi khi tạo hóa đơn tạm tính: ') + (e.message || e));
    }
  };

  const closeSession = (id) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeId === id) setActiveId(remaining.length ? remaining[remaining.length - 1].id : null);
  };

  const addToCart = async (item, type) => {
    let session = activeSession;
    if (!session) {
      if (currentBranchId === 'all' || !currentBranchId) {
        return toast.error(t('pos.err_select_branch_add_item', 'Vui lòng chọn một cơ sở cụ thể ở góc trên bên trái trước khi chọn món'));
      }

      try {
        const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
        const initialLog = createLogEntry(`Tạo hoá đơn #${saleCode}`, `Khởi tạo hoá đơn & thêm ${item.name}`, 'Lễ tân');
        
        const newInv = await base44.entities.Invoice.create({
          invoice_code: saleCode,
          customer_name: '',
          customer_id: '',
          branch_id: currentBranchId,
          items: [{ 
            name: item.name, 
            type, 
            price: item.price, 
            qty: 1, 
            staff_id: '', 
            staff_name: '',
            is_customer_requested: false,
            balance: item.balance || item.face_value || 0,
            sessions: item.usage_count || item.sessions || 10,
            color: item.color,
            duration_minutes: item.duration_minutes || item.duration || 0,
            image_url: item.image_url || item.image || ''
          }],
          subtotal: item.price,
          discount: 0,
          total: item.price,
          tip: 0,
          status: 'unpaid',
          date: todayStr(),
          logs: JSON.stringify([initialLog])
        });

        await loadUnpaidInvoices(newInv.id);
        toast.success(`${t('pos.toast_invoice_created', 'Đã tạo hóa đơn tạm tính mới')} • ${saleCode}`);
      } catch (e) {
        toast.error(t('pos.err_create_invoice', 'Lỗi khi tạo hóa đơn tạm tính: ') + (e.message || e));
      }
      return;
    }

    const cart = session.cart || [];
    const existing = cart.find((x) => x.name === item.name && x.type === type);
    const newCartWithoutDiscounts = existing ?
      cart.map((x) => x === existing ? { ...x, qty: (x.qty || 1) + 1 } : x) :
      [...cart, { 
        name: item.name, 
        type, 
        price: item.price, 
        originalPrice: item.price, 
        qty: 1, 
        staff_id: '', 
        staff_name: '',
        balance: item.balance || item.face_value || 0,
        sessions: item.usage_count || item.sessions || 10,
        color: item.color,
        duration_minutes: item.duration_minutes || item.duration || 0,
        image_url: item.image_url || item.image || ''
      }];
    
    const newCart = applyDiscountsToCart(newCartWithoutDiscounts, session.promo, session.voucher);
    let discountType = 'vnd';
    let discountValue = 0;
    if (session.promo && session.promo.type === 'invoice') {
      discountType = session.promo.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = session.promo.value;
    } else if (session.voucher && session.voucher.type === 'invoice') {
      discountType = session.voucher.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = session.voucher.value;
    } else {
      discountType = session.discountType || 'vnd';
      discountValue = session.discountValue || 0;
    }
    
    patchSession({ cart: newCart, discountType, discountValue });
  };

  const createCustomer = async (data) => {
    const c = await base44.entities.Customer.create(data);
    setCustomers((arr) => [c, ...arr]);
    patchSession({ customer: c });
    setCustModal(false);
    toast.success(t('pos.toast_customer_added', 'Đã thêm khách hàng'));
  };

  const checkout = async ({ tip, discount, payments, tipSplits, sessionCustomer }) => {
    const session = activeSession;
    if (!session) return;
    if (!session.cart?.length) return toast.error(t('pos.err_empty_cart', 'Giỏ hàng trống'));
    
    if (currentBranchId === 'all' || !currentBranchId) {
      return toast.error(t('pos.err_select_branch_checkout', 'Vui lòng chọn một cơ sở cụ thể ở góc trên bên trái để thanh toán hoá đơn'));
    }
    
    const effectiveCustomer = sessionCustomer ?? session.customer;
    const hasMembershipItem = session.cart.some(item => item.type !== 'service' && item.type !== 'product');
    if (hasMembershipItem && (!effectiveCustomer || !effectiveCustomer.id)) {
      return toast.error(t('pos.err_membership_need_customer', 'Vui lòng chọn khách hàng khi thanh toán gói dịch vụ, liệu trình hoặc thẻ tiền mặt'));
    }
    
    setPaying(true);
    try {
      const cart = session.cart;
      const subtotal = Math.round(cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0));
      const total = Math.max(0, subtotal - Math.round(discount)) + Math.round(tip);
      const invoiceData = {
        invoice_code: session.saleCode || ('SC' + String(Math.floor(100000 + Math.random() * 900000))),
        customer_id: effectiveCustomer?.id || '',
        customer_name: (effectiveCustomer?.name && effectiveCustomer.name.trim()) ? effectiveCustomer.name.trim() : 'Khách vãng lai',
        branch_id: (currentBranchId === 'all' || !currentBranchId) ? '' : currentBranchId,
        items: cart.map((x) => {
          let dbType = x.type;
          if (dbType !== 'service' && dbType !== 'product') {
            dbType = 'package';
          }
          return { 
            name: x.name, 
            type: dbType, 
            price: Math.round(x.price || 0), 
            qty: Math.round(x.qty || 1), 
            staff_id: x.staff_id || '', 
            staff_name: x.staff_name || '',
            is_customer_requested: !!x.is_customer_requested,
            is_from_package: !!x.is_from_package,
            package_name: x.package_name || '',
            customer_package_id: x.customer_package_id || null,
            customer_treatment_id: x.customer_treatment_id || null,
            balance: Math.round(x.balance || 0),
            sessions: Math.round(x.sessions || 10)
          };
        }),
        subtotal, 
        discount: Math.round(discount), 
        total: Math.round(total), 
        tip: Math.round(tip),
        tip_splits: (tipSplits || []).map(s => ({ staff_id: s.staffId, amount: Math.round(s.amount || 0) })),
        payment_methods: payments.map(p => ({ method: p.method, amount: Math.round(p.amount || 0) })), 
        status: 'paid', 
        date: todayStr(),
        logs: [
          ...(session.logs || []),
          {
            id: 'log_pay_' + Date.now(),
            action: 'Thanh toán hoá đơn',
            details: `Thanh toán thành công ${formatVND(total)}`,
            time: new Date().toISOString(),
            user: 'Thu ngân'
          }
        ],
        deposit_id: session.deposit?.id || null,
        deposit_amount: Math.round(session.deposit?.paid_amount || 0)
      };

      // Ensure all used package/treatment IDs exist in the database tables to prevent trigger foreign key failures
      for (const item of cart) {
        if (item.is_from_package && effectiveCustomer?.id) {
          if (item.customer_treatment_id) {
            try {
              const ctList = await base44.entities.CustomerTreatment.filter({ id: item.customer_treatment_id });
              if (!ctList || ctList.length === 0) {
                const trts = await base44.entities.Treatment.list();
                const matchedTrt = trts.find(t => t.name.trim() === item.package_name?.trim());
                await base44.entities.CustomerTreatment.create({
                  id: item.customer_treatment_id,
                  customer_id: effectiveCustomer.id,
                  treatment_id: matchedTrt?.id || item.id,
                  total_usage: Math.round(item.sessions || 10),
                  remaining_usage: Math.round(item.sessions || 10),
                  branch_id: currentBranchId || null
                });
              }
            } catch (err) {
              console.warn('Failed to ensure CustomerTreatment record exists:', err);
            }
          } else if (item.customer_package_id) {
            try {
              const cpList = await base44.entities.CustomerPackage.filter({ id: item.customer_package_id });
              if (!cpList || cpList.length === 0) {
                const pkgs = await base44.entities.ServicePackage.list();
                const matchedPkg = pkgs.find(p => p.name.trim() === item.package_name?.trim());
                await base44.entities.CustomerPackage.create({
                  id: item.customer_package_id,
                  customer_id: effectiveCustomer.id,
                  package_id: matchedPkg?.id || item.id,
                  total_usage: Math.round(item.sessions || 10),
                  remaining_usage: Math.round(item.sessions || 10),
                  branch_id: currentBranchId || null
                });
              }
            } catch (err) {
              console.warn('Failed to ensure CustomerPackage record exists:', err);
            }
          }
        }
      }

      let createdInv = null;
      if (session.isRestoredFromInvoice) {
        await base44.entities.Invoice.update(session.id, invoiceData);
      } else {
        createdInv = await base44.entities.Invoice.create(invoiceData);
      }

      // Decrement sessions_remaining in membership table for used packages/treatments
      for (const item of cart) {
        if (item.is_from_package) {
          const targetId = item.customer_package_id || item.customer_treatment_id;
          if (targetId) {
            try {
              const mems = await base44.entities.Membership.list();
              const matchedMem = mems.find(m => String(m.id) === String(targetId));
              if (matchedMem) {
                const currentRemaining = Number(matchedMem.sessions_remaining || 0);
                const nextRemaining = Math.max(0, currentRemaining - (item.qty || 1));
                await base44.entities.Membership.update(matchedMem.id, {
                  sessions_remaining: nextRemaining,
                  status: nextRemaining <= 0 ? 'exhausted' : 'active'
                });
              }
            } catch (err) {
              console.error('Failed to update membership session count:', err);
            }
          }
        }
      }

      if (effectiveCustomer && effectiveCustomer.id) {
        // Create purchased memberships
        for (const item of cart) {
          if (item.type !== 'service' && item.type !== 'product') {
            let memType = 'package';
            let defaultColor = '#3B82F6';
            if (item.type === 'cash_card' || item.name.toLowerCase().includes('thẻ') || item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('ví')) {
              memType = 'cash_card';
              defaultColor = '#FF6B9D';
            } else if (item.type === 'treatment' || item.name.toLowerCase().includes('liệu trình') || item.name.toLowerCase().includes('trị mụn') || item.name.toLowerCase().includes('buổi')) {
              memType = 'treatment_course';
              defaultColor = '#10B981';
            }
            
            let itemColor = item.color;
            let expiryMonths = item.expiry_months || 0;
            let expiryDays = item.expiry_days || 0;
            const matchedCatalog = (prepaidCards || []).find(c => c.name === item.name) || 
                                   (packages || []).find(p => p.name === item.name) || 
                                   (treatments || []).find(t => t.name === item.name);
            if (matchedCatalog) {
              if (!itemColor && matchedCatalog.color) {
                itemColor = matchedCatalog.color;
              }
              if (!expiryMonths && matchedCatalog.expiry_months) {
                expiryMonths = matchedCatalog.expiry_months;
              }
              if (!expiryDays && matchedCatalog.expiry_days) {
                expiryDays = matchedCatalog.expiry_days;
              }
            }

            let expiryDate = null;
            if (expiryMonths > 0 || expiryDays > 0) {
              const d = new Date();
              if (expiryMonths > 0) d.setMonth(d.getMonth() + expiryMonths);
              if (expiryDays > 0) d.setDate(d.getDate() + expiryDays);
              expiryDate = d.toISOString().slice(0, 10);
            }

            await base44.entities.Membership.create({
              customer_id: effectiveCustomer.id,
              customer_name: effectiveCustomer.name || 'Khách hàng',
              branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId,
              name: item.name,
              type: memType,
              balance: Math.round(item.balance || item.price * 1.1 || 2000000),
              total_sessions: Math.round(item.sessions || 10),
              sessions_remaining: Math.round(item.sessions || 10),
              is_active: true,
              purchased_date: todayStr(),
              expiry_date: expiryDate,
              color: itemColor || defaultColor,
              invoice_id: createdInv?.id || session.id || null,
              invoice_code: invoiceData.invoice_code || session.saleCode || null,
              status: 'active',
              is_deleted: false
            });
          }
        }

        const newPoints = Math.floor(total / 10000);
        await base44.entities.Customer.update(effectiveCustomer.id, {
          total_spent: Number(effectiveCustomer.total_spent || 0) + total,
          points: Math.max(0, Number(effectiveCustomer.points || 0) + newPoints),
          visit_count: Number(effectiveCustomer.visit_count || 0) + 1,
          last_visit: todayStr()
        });

        // Record promo usage if session.promo or session.voucher is applied
        if (session.promo || session.voucher) {
          try {
            const localUsages = localStorage.getItem('glopro_promo_usages');
            const usages = localUsages ? JSON.parse(localUsages) : [];
            const discountAmt = Math.round(discount);

            if (session.promo) {
              const newUsage = {
                id: 'usage_' + Date.now() + Math.random().toString(36).substr(2, 5),
                customer_id: effectiveCustomer.id,
                customer_name: effectiveCustomer.name || 'Khách hàng',
                invoice_id: createdInv?.id || session.id || 'inv_temp_' + Date.now(),
                invoice_code: invoiceData.invoice_code || session.saleCode || 'INV-' + Date.now(),
                campaign_id: session.promo.id,
                campaign_name: session.promo.name,
                discount_amount: discountAmt,
                invoice_total: Math.round(total),
                date: todayStr(),
                branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId
              };
              usages.push(newUsage);

              if (session.promo.isGiftable) {
                try {
                  const localGifts = localStorage.getItem('glopro_customer_gifts');
                  if (localGifts) {
                    const gifts = JSON.parse(localGifts);
                    if (gifts[effectiveCustomer.id]) {
                      const giftToMark = gifts[effectiveCustomer.id].find(g => g.promo_id === session.promo.id && !g.used);
                      if (giftToMark) {
                        giftToMark.used = true;
                                                // Instead of simple subtraction, we should update the DB. For simplicity in this POS context, we find available gifts and mark as used or decrement.
                        try {
                          const gList = await base44.entities.CustomerGift.list();
                          const available = gList.filter(g => g.customer_id === currentCustomer.id && g.gift_name === item.name && g.status === 'available');
                          if (available.length > 0) {
                            let toDeduct = 1; // Assuming qty=1 for gift usage in cart
                            for (const g of available) {
                               if (toDeduct <= 0) break;
                               if (g.qty > toDeduct) {
                                  await base44.entities.CustomerGift.update(g.id, { qty: g.qty - toDeduct });
                                  toDeduct = 0;
                               } else {
                                  await base44.entities.CustomerGift.update(g.id, { status: 'used' });
                                  toDeduct -= g.qty;
                               }
                            }
                          }
                        } catch(e){}
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error marking gift as used:', e);
                }
              }
            }

            if (session.voucher) {
              const newUsage = {
                id: 'usage_' + Date.now() + Math.random().toString(36).substr(2, 5),
                customer_id: effectiveCustomer.id,
                customer_name: effectiveCustomer.name || 'Khách hàng',
                invoice_id: createdInv?.id || session.id || 'inv_temp_' + Date.now(),
                invoice_code: invoiceData.invoice_code || session.saleCode || 'INV-' + Date.now(),
                campaign_id: session.voucher.code,
                campaign_name: session.voucher.name || session.voucher.code,
                discount_amount: session.promo ? 0 : discountAmt,
                invoice_total: Math.round(total),
                date: todayStr(),
                branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId
              };
              usages.push(newUsage);
            }

                        for (const u of usages) {
              if (u.is_new) {
                delete u.is_new;
                await base44.entities.PromoUsage.create(u).catch(()=>{});
              }
            }
          } catch (pe) {
            console.error('Error recording promo/voucher usage:', pe);
          }
        }
      }
      // ── Auto cash flow: Phiếu Thu ───────────────────────────────────────
      try {
        const invId = createdInv?.id || session.id;
        const invCode = invoiceData.invoice_code || session.saleCode;
        const branchId = (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId;
        const primaryMethod = (payments?.[0]?.method) || 'cash';
        const saleAmount = Math.max(0, subtotal - Math.round(discount));
        const hasMembership = cart.some(x => x.type !== 'service' && x.type !== 'product');

        // Phiếu thu bán hàng / gói
        if (saleAmount > 0) {
          await createIncomeVoucher({
            typeCode: hasMembership ? 'membership_sale' : 'sale',
            typeName: hasMembership ? 'Bán gói / Thẻ' : 'Bán hàng / Dịch vụ',
            amount: saleAmount,
            description: `Thanh toán hoá đơn #${invCode}`,
            paymentMethod: primaryMethod,
            refId: invId,
            refCode: invCode,
            branchId,
          });
        }

        // Phiếu thu tiền TIP (riêng biệt)
        if (Math.round(tip) > 0) {
          await createIncomeVoucher({
            typeCode: 'tip',
            typeName: 'Tiền TIP',
            amount: Math.round(tip),
            description: `Tiền TIP hoá đơn #${invCode}`,
            paymentMethod: primaryMethod,
            refId: invId,
            refCode: invCode,
            branchId,
          });
        }
      } catch (cfErr) {
        console.warn('[CashFlow] Auto income voucher failed:', cfErr.message);
      }
      // ────────────────────────────────────────────────────────────────────

      toast.success(`${t('pos.toast_payment_success', 'Thanh toán thành công')} • ${session.saleCode}`);
      closeSession(session.id);
      setCheckoutOpen(false);
    } catch (e) {
      toast.error(t('pos.err_generic', 'Lỗi: ') + (e.message || e));
    }
    setPaying(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] md:h-[calc(100vh-75px)] overflow-hidden space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t('pos.title', 'Thu ngân')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/invoices')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <BarChart3 className="w-4 h-4" /> {t('pos.invoice_list', 'Danh sách hoá đơn')}
          </button>
          <button onClick={createSale} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> {t('pos.btn_create_order', 'Tạo đơn')}
          </button>
        </div>
      </div>

      {/* Session tabs */}
      {sessions.length > 0 &&
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
          {sessions.map((s) => {
            const isReviewing = s.reviewStatus === 'reviewing';
            const isDone = s.reviewStatus === 'done';

            return (
              <button key={s.id} onClick={() => setActiveId(s.id)}
                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-t-xl border-b-2 text-sm whitespace-nowrap transition-colors relative ${
                  s.id === activeId 
                    ? 'bg-white border-emerald-500 font-semibold text-slate-800 shadow-2xs' 
                    : 'bg-slate-100/70 border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                {s.customer ? (
                  <Avatar src={s.customer.avatar_url} name={s.customer.name} size={20} color="#E879A9" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">W</div>
                )}
                <span>{tabName(s)}</span>

                {/* Review status badge indicator */}
                {isReviewing && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-[10px] font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Đang đánh giá</span>
                  </span>
                )}
                {isDone && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>Đã đánh giá</span>
                  </span>
                )}

                <span onClick={(e) => {e.stopPropagation();closeSession(s.id);}} className="ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>
      }

      {/* POS Content Area — Desktop: split 2 cols, Mobile: ticket main + catalog slide-up overlay */}

      {/* DESKTOP layout (lg+): side-by-side catalog + ticket */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <CatalogColumn tab={catalogTab} setTab={setCatalogTab} search={search} setSearch={setSearch}
        services={services} products={products} packages={packages} treatments={treatments}
        serviceCombos={serviceCombos} productCombos={productCombos} prepaidCards={prepaidCards}
        groups={groups} onAddItem={addToCart} onReload={() => loadData(true)} activeSession={activeSession} isLoading={isLoadingCatalog} />
        {activeSession ?
        <TicketColumn session={activeSession} staff={staff} customers={customers}
        onUpdate={patchSession}
        onPickCustomer={(c) => patchSession({ customer: c })}
        onClearCustomer={() => patchSession({ customer: null })}
        onNewCustomer={(query) => { setCustQuery(query || ''); setCustModal(true); }}
        onCheckout={() => setCheckoutOpen(true)}
        onCancel={async () => {
          const session = activeSession;
          if (!session) return;
          if (!confirm(t('pos.confirm_cancel_invoice', 'Bạn có chắc chắn muốn huỷ hoá đơn tạm tính này? Hoá đơn sẽ được đưa vào danh sách đã huỷ.'))) return;
          try {
            const updatedLogs = [
              ...getNormalizedLogs(session),
              createLogEntry(t('pos.log_cancel_invoice', 'Huỷ hoá đơn'), t('pos.log_cancel_invoice_detail', 'Huỷ hoá đơn khỏi hệ thống'), getCurrentUser())
            ];
            await base44.entities.Invoice.update(session.id, { status: 'cancelled', previous_status: 'unpaid', logs: JSON.stringify(updatedLogs) });
            toast.success(t('pos.toast_invoice_cancelled', 'Đã huỷ hoá đơn tạm tính'));
            closeSession(session.id);
          } catch (e) {
            toast.error(t('pos.err_generic', 'Lỗi: ') + (e.message || e));
          }
        }}
        onReview={() => setReviewModalOpen(true)}
        disabled={currentBranchId === 'all'} /> :

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
            <EmptyCart />
          </div>
        }
      </div>

      {/* MOBILE layout (< lg): Ticket as main view + Catalog as slide-up overlay */}
      <div className="flex lg:hidden flex-1 overflow-hidden min-h-0 relative w-full">
        {/* Main panel: TicketColumn */}
        <div className="absolute inset-0 flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm">
          {activeSession ?
          <TicketColumn session={activeSession} staff={staff} customers={customers}
          onUpdate={patchSession}
          onPickCustomer={(c) => patchSession({ customer: c })}
          onClearCustomer={() => patchSession({ customer: null })}
          onNewCustomer={(query) => { setCustQuery(query || ''); setCustModal(true); }}
          onCheckout={() => setCheckoutOpen(true)}
          onCancel={async () => {
            const session = activeSession;
            if (!session) return;
            if (!confirm(t('pos.confirm_cancel_invoice', 'Bạn có chắc chắn muốn huỷ hoá đơn tạm tính này? Hoá đơn sẽ được đưa vào danh sách đã huỷ.'))) return;
            try {
              const updatedLogs = [
                ...getNormalizedLogs(session),
                createLogEntry(t('pos.log_cancel_invoice', 'Huỷ hoá đơn'), t('pos.log_cancel_invoice_detail', 'Huỷ hoá đơn khỏi hệ thống'), getCurrentUser())
              ];
              await base44.entities.Invoice.update(session.id, { status: 'cancelled', previous_status: 'unpaid', logs: JSON.stringify(updatedLogs) });
              toast.success(t('pos.toast_invoice_cancelled', 'Đã huỷ hoá đơn tạm tính'));
              closeSession(session.id);
            } catch (e) {
              toast.error(t('pos.err_generic', 'Lỗi: ') + (e.message || e));
            }
          }}
          onReview={() => setReviewModalOpen(true)}
          disabled={currentBranchId === 'all'} 
          onMobileAddClick={() => setCatalogOpen(true)} 
          /> :

          <div className="h-full flex items-center justify-center">
              <EmptyCart />
            </div>
          }
        </div>

        {/* Slide-up overlay: CatalogColumn (mobile only) */}
        <div className={`absolute inset-0 z-50 bg-white rounded-2xl border border-slate-100 shadow-xl flex flex-col min-w-0 transition-transform duration-300 ${catalogOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0 shadow-sm rounded-t-2xl">
            <h3 className="font-bold text-slate-800">{t('pos.invoice.select_items', 'Thêm Dịch vụ / Sản phẩm')}</h3>
            <button onClick={() => setCatalogOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/50 min-w-0 relative pb-20">
            <CatalogColumn tab={catalogTab} setTab={setCatalogTab} search={search} setSearch={setSearch}
            services={services} products={products} packages={packages} treatments={treatments}
            serviceCombos={serviceCombos} productCombos={productCombos} prepaidCards={prepaidCards}
            groups={groups} 
            onAddItem={(item) => {
              addToCart(item);
              toast.success(t('pos.added', 'Đã thêm') + ': ' + item.name);
            }} 
            onReload={() => loadData(true)} activeSession={activeSession} isLoading={isLoadingCatalog} />
          </div>
          {/* Footer with Apply button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-2xl">
             <div className="text-sm font-medium text-slate-600">
               {t('pos.selected_items', 'Đã chọn')}: <span className="font-bold text-emerald-600 text-base">{activeSession?.cart?.length || 0}</span>
             </div>
             <button 
               onClick={() => setCatalogOpen(false)} 
               className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-sm"
             >
               {t('pos.apply', 'Áp dụng')}
             </button>
          </div>
        </div>
      </div>

      <CheckoutModal open={checkoutOpen} session={activeSession} staff={staff} onClose={() => setCheckoutOpen(false)}
      onConfirm={checkout} paying={paying} />
      {custModal && <NewCustomerModal initialQuery={custQuery} onClose={() => setCustModal(false)} onCreate={createCustomer} />}
      {reviewModalOpen && activeSession && (
        <ReviewQRModal 
          open={reviewModalOpen} 
          session={activeSession} 
          onClose={() => setReviewModalOpen(false)} 
          patchSession={patchSession}
          syncSessionToDb={syncSessionToDb}
        />
      )}
    </div>);
}

const EMOJIS = [
  { score: 'poor', label: 'Quá tệ', icon: '😫' },
  { score: 'average', label: 'Bình thường', icon: '😐' },
  { score: 'good', label: 'Good', icon: '😚' },
  { score: 'very_good', label: 'Rất tốt', icon: '😍' },
];

function ReviewQRModal({ open, session, onClose, patchSession, syncSessionToDb }) {
  const [reviewStep, setReviewStep] = useState('waiting'); // 'waiting', 'reviewing', 'done'
  const [reviewData, setReviewData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !session) return;
    
    // Ensure the invoice is saved/synced in database so review page can load it
    if (syncSessionToDb) {
      syncSessionToDb(session);
    }

    // Check initial status
    if (session.reviewStatus === 'done' || session.reviewData?.status === 'done') {
      setReviewStep('done');
      setReviewData(session.reviewData);
    } else if (session.reviewStatus === 'reviewing' || session.reviewData?.status === 'reviewing') {
      setReviewStep('reviewing');
      setReviewData(session.reviewData);
    } else {
      const key = `glopro_review_${session.id}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          setReviewData(parsed);
          setReviewStep(parsed.status || 'done');
        } catch (e) {
          setReviewStep('waiting');
          setReviewData(null);
        }
      } else {
        setReviewStep('waiting');
        setReviewData(null);
      }
    }

    // Storage listener
    const handleStorageChange = (e) => {
      if (e.key === `glopro_review_${session.id}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          setReviewData(data);
          setReviewStep(data.status || 'done');
          
          if (data.status === 'done') {
            toast.success('Khách hàng đã hoàn thành đánh giá!');
            const patchObj = {};
            if (data.tip !== undefined) {
              patchObj.tip = data.tip;
              patchObj.tipSplits = data.tipSplits || [];
            }
            if (data.customerInfo && data.customerInfo.name) {
              patchObj.customer = {
                id: data.customerInfo.id || 'cust_' + Date.now(),
                name: data.customerInfo.name,
                phone: data.customerInfo.phone,
                email: data.customerInfo.email,
                dob: data.customerInfo.dob,
                birthday: data.customerInfo.dob
              };
            }
            patchSession(patchObj);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Supabase Channel listener
    const channel = supabase.channel(`glopro_review_${session.id}`)
      .on('broadcast', { event: 'status_change' }, (payload) => {
        if (payload?.payload) {
          const data = payload.payload;
          setReviewData(data);
          setReviewStep(data.status || 'done');
          if (data.status === 'done') {
            toast.success('Khách hàng đã hoàn thành đánh giá!');
            const patchObj = {};
            if (data.tip !== undefined) {
              patchObj.tip = data.tip;
              patchObj.tipSplits = data.tipSplits || [];
            }
            if (data.customerInfo && data.customerInfo.name) {
              patchObj.customer = {
                id: data.customerInfo.id || 'cust_' + Date.now(),
                name: data.customerInfo.name,
                phone: data.customerInfo.phone,
                email: data.customerInfo.email,
                dob: data.customerInfo.dob,
                birthday: data.customerInfo.dob
              };
            }
            patchSession(patchObj);
          }
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      supabase.removeChannel(channel);
    };
  }, [open, session?.id]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const reviewUrl = `${originUrl}/review/${session.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=8&data=${encodeURIComponent(reviewUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 text-center space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 -mt-1">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">Khảo sát & Đánh giá dịch vụ</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State 1: Waiting for scan */}
        {reviewStep === 'waiting' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Quét mã QR để đánh giá</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Khách hàng mở camera điện thoại hoặc Zalo để quét mã QR đánh giá KTV và thưởng tip.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white border-2 border-slate-200 p-3 rounded-2xl inline-block shadow-sm">
              <img 
                src={qrImageUrl} 
                alt="QR Code Đánh Giá" 
                className="w-48 h-48 rounded-lg object-contain mx-auto"
                loading="eager"
              />
            </div>

            {/* Direct URL text & Copy button */}
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-left max-w-sm mx-auto">
              <input 
                type="text" 
                readOnly 
                value={reviewUrl} 
                className="flex-1 bg-transparent text-[11px] font-mono text-slate-600 outline-none truncate" 
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(reviewUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success('Đã sao chép link đánh giá!');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[10px] font-bold shrink-0 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>

            {/* Simulated trigger button for testing on same device */}
            <div>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>Mở link đánh giá (Tab mới)</span>
              </a>
            </div>

            {/* Waiting indicator */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              <span>Đang chờ khách hàng quét mã...</span>
            </div>
          </div>
        )}

        {/* State 2: Customer is reviewing (Amber/Yellow) */}
        {reviewStep === 'reviewing' && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
              <Smile className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-amber-700 text-base">Khách hàng đang đánh giá!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Khách đang điền thông tin và chấm điểm chất lượng phục vụ trên điện thoại...
              </p>
            </div>

            {/* Progress animation */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-amber-800">Đang nhận dữ liệu thời gian thực...</span>
            </div>

            <div>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
              >
                Mở lại trang đánh giá
              </a>
            </div>
          </div>
        )}

        {/* State 3: Review Completed (Done / Green) */}
        {reviewStep === 'done' && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-500 flex items-center justify-center mx-auto animate-bounce shadow-xs">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">Khách đã hoàn tất đánh giá!</h3>
              <p className="text-xs text-slate-400">Ý kiến phản hồi và tiền tip đã được ghi nhận vào hoá đơn.</p>
            </div>

            {reviewData && (
              <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-2.5 border border-slate-150">
                <div className="font-bold text-slate-800 pb-1.5 border-b border-slate-200 flex justify-between items-center">
                  <span>Chi tiết đánh giá:</span>
                  {reviewData.customerInfo?.name && (
                    <span className="text-blue-600 font-semibold">{reviewData.customerInfo.name}</span>
                  )}
                </div>

                {/* Ratings per staff */}
                <div className="space-y-1.5">
                  {Object.entries(reviewData.ratings || {}).map(([sid, scoreKey]) => {
                    const ratingObj = EMOJIS.find(e => e.score === scoreKey) || { icon: '⭐', label: scoreKey };
                    const staffObj = (session.cart || []).find(x => x.staff_id === sid);
                    const staffName = staffObj?.staff_name || 'Kỹ thuật viên';
                    return (
                      <div key={sid} className="flex justify-between items-center">
                        <span className="font-medium">{staffName}:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          <span>{ratingObj.icon}</span>
                          <span>{ratingObj.label}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Tip total if any */}
                {reviewData.tip > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-emerald-600 font-black text-sm">
                    <span>Thưởng thêm Tip:</span>
                    <span>+{formatVND(reviewData.tip)}</span>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={onClose} 
              className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/20"
            >
              Đóng và tiếp tục
            </button>
          </div>
        )}
      </div>
    </div>
  );
}