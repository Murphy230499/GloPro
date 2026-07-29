'use client';
import React, { useState, useEffect } from 'react';
import { Archive, Boxes, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Building2, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { toast } from '@/components/Layout';
import ProductForm from '@/components/services/ProductForm';

import InventoryOverviewTab from '@/components/inventory/InventoryOverviewTab';
import StockInTab from '@/components/inventory/StockInTab';
import StockOutTab from '@/components/inventory/StockOutTab';
import StockTransferTab from '@/components/inventory/StockTransferTab';
import SuppliersTab from '@/components/inventory/SuppliersTab';

import {
  loadSuppliersData, saveSuppliersData,
  loadStockReceiptsData, saveStockReceiptsData,
  loadStockTransfersData, saveStockTransfersData
} from '@/lib/seeders/inventorySeeder';

const TABS = [
  { id: 'overview', label: 'Tổng Quan Tồn Kho', icon: Boxes },
  { id: 'stock_in', label: 'Quản Lý Nhập Kho', icon: ArrowDownLeft },
  { id: 'stock_out', label: 'Quản Lý Xuất Kho', icon: ArrowUpRight },
  { id: 'transfer', label: 'Chuyển Kho Chi Nhánh', icon: ArrowRightLeft },
  { id: 'suppliers', label: 'Nhà Cung Cấp', icon: Building2 }
];

export default function InventoryView() {
  const { currentBranchId } = useBranch();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockReceipts, setStockReceipts] = useState([]);
  const [stockTransfers, setStockTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products
      const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
      const prods = await base44.entities.Product.filter(filter).catch(() => []);
      setProducts(prods);

      // 2. Load Suppliers, Stock Receipts, Transfers
      setSuppliers(loadSuppliersData());
      setStockReceipts(loadStockReceiptsData());
      setStockTransfers(loadStockTransfersData());
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu kho hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentBranchId]);

  // Handlers for Stock In / Out Receipts
  const handleCreateStockReceipt = async (receiptData) => {
    const updatedReceipts = [receiptData, ...stockReceipts];
    setStockReceipts(updatedReceipts);
    saveStockReceiptsData(updatedReceipts);

    // Update product quantities
    const isStockIn = receiptData.type === 'in';
    const updatedProducts = [...products];

    for (const item of receiptData.items || []) {
      const pIndex = updatedProducts.findIndex(p => p.id === item.product_id);
      if (pIndex !== -1) {
        const currentStock = updatedProducts[pIndex].stock || 0;
        const newStock = isStockIn ? currentStock + item.qty : Math.max(0, currentStock - item.qty);
        
        updatedProducts[pIndex] = {
          ...updatedProducts[pIndex],
          stock: newStock,
          cost_price: isStockIn ? item.unit_price : (updatedProducts[pIndex].cost_price || updatedProducts[pIndex].price * 0.7)
        };

        // Sync with base44 entity
        await base44.entities.Product.update(item.product_id, {
          stock: newStock,
          cost_price: updatedProducts[pIndex].cost_price
        }).catch(() => {});
      }
    }

    setProducts(updatedProducts);

    // Update Supplier debt if Stock In has debt
    if (isStockIn && receiptData.supplier_id && receiptData.debt_amount > 0) {
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === receiptData.supplier_id) {
          return {
            ...s,
            debt: (s.debt || 0) + receiptData.debt_amount,
            total_imported: (s.total_imported || 0) + receiptData.total_amount
          };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      saveSuppliersData(updatedSuppliers);
    }

    toast.success(isStockIn ? 'Đã tạo phiếu nhập kho thành công' : 'Đã tạo phiếu xuất kho thành công');
  };

  // Handlers for Inter-branch Transfers
  const handleCreateStockTransfer = (transferData) => {
    const updatedTransfers = [transferData, ...stockTransfers];
    setStockTransfers(updatedTransfers);
    saveStockTransfersData(updatedTransfers);
    toast.success('Đã khởi tạo phiếu chuyển kho thành công');
  };

  const handleConfirmReceiveTransfer = (transferId) => {
    const updatedTransfers = stockTransfers.map(t => {
      if (t.id === transferId) {
        return { ...t, status: 'transferred' };
      }
      return t;
    });
    setStockTransfers(updatedTransfers);
    saveStockTransfersData(updatedTransfers);
    toast.success('Đã xác nhận nhận đủ hàng điều chuyển');
  };

  // Handlers for Suppliers CRUD
  const handleSaveSupplier = (formData) => {
    let updated;
    if (formData.id) {
      updated = suppliers.map(s => s.id === formData.id ? formData : s);
    } else {
      updated = [{ ...formData, id: `sup_${Date.now()}` }, ...suppliers];
    }
    setSuppliers(updated);
    saveSuppliersData(updated);
    toast.success(formData.id ? 'Đã cập nhật Nhà cung cấp' : 'Đã thêm mới Nhà cung cấp');
  };

  const handleDeleteSupplier = (supplierId) => {
    if (confirm('Bạn có chắc chắn muốn xóa Nhà cung cấp này?')) {
      const updated = suppliers.filter(s => s.id !== supplierId);
      setSuppliers(updated);
      saveSuppliersData(updated);
      toast.success('Đã xóa Nhà cung cấp');
    }
  };

  // Handlers for Product Save
  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct?.id) {
        await base44.entities.Product.update(editingProduct.id, formData);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await base44.entities.Product.create({ ...formData, branch_id: currentBranchId });
        toast.success('Đã tạo mới sản phẩm kho');
      }
      setEditingProduct(null);
      loadAllData();
    } catch (e) {
      toast.error('Lỗi lưu sản phẩm');
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Quản Lý Kho Hàng</h1>
          <p className="text-slate-400 text-sm mt-1">Theo dõi tồn kho, nhập kho, xuất kho, điều chuyển chi nhánh & công nợ nhà cung cấp</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingProduct({ type: 'product' })}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Render */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <InventoryOverviewTab
              products={products}
              onEditProduct={(p) => setEditingProduct({ ...p, type: 'product' })}
              onDeleteProduct={async (id) => {
                if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
                  await base44.entities.Product.delete(id).catch(() => {});
                  toast.success('Đã xóa sản phẩm');
                  loadAllData();
                }
              }}
              onOpenStockIn={() => setActiveTab('stock_in')}
              onOpenStockOut={() => setActiveTab('stock_out')}
            />
          )}

          {activeTab === 'stock_in' && (
            <StockInTab
              stockReceipts={stockReceipts}
              suppliers={suppliers}
              products={products}
              onCreateReceipt={handleCreateStockReceipt}
            />
          )}

          {activeTab === 'stock_out' && (
            <StockOutTab
              stockReceipts={stockReceipts}
              products={products}
              onCreateReceipt={handleCreateStockReceipt}
            />
          )}

          {activeTab === 'transfer' && (
            <StockTransferTab
              stockTransfers={stockTransfers}
              products={products}
              onCreateTransfer={handleCreateStockTransfer}
              onConfirmReceiveTransfer={handleConfirmReceiveTransfer}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersTab
              suppliers={suppliers}
              onSaveSupplier={handleSaveSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}
        </>
      )}

      {/* Product Form Modal */}
      {editingProduct && (
        <ProductForm
          item={editingProduct}
          groups={[]}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}
