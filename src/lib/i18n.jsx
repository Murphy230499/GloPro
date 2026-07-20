'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  vi: {
    'nav.dashboard': 'Tổng quan', 'nav.appointments': 'Lịch hẹn', 'nav.pos': 'Thu ngân',
    'nav.customers': 'Khách hàng', 'nav.staff': 'Nhân viên', 'nav.catalog': 'Danh mục',
    'nav.reports': 'Báo cáo', 'nav.settings': 'Cài đặt', 'nav.more': 'Khác', 'nav.all_features': 'Tất cả chức năng',
    'nav.discounts': 'Giảm giá',
    'top.all_branches': 'Tất cả cơ sở',
    'common.add': 'Thêm', 'common.edit': 'Sửa', 'common.delete': 'Xoá', 'common.save': 'Lưu',
    'common.cancel': 'Huỷ', 'common.loading': 'Đang tải...', 'common.search': 'Tìm...', 'common.manage_groups': 'Quản lý nhóm',
    'catalog.title': 'Danh mục', 'catalog.subtitle': 'Quản lý dịch vụ, sản phẩm, gói, liệu trình, combo, thẻ tiền mặt và kho',
    'catalog.service': 'Dịch vụ', 'catalog.product': 'Sản phẩm', 'catalog.package': 'Gói dịch vụ',
    'catalog.treatment': 'Liệu trình', 'catalog.service_combo': 'Combo dịch vụ', 'catalog.product_combo': 'Combo sản phẩm',
    'catalog.prepaid_card': 'Thẻ tiền mặt', 'catalog.inventory': 'Kho hàng',
    'pos.title': 'Thu ngân', 'pos.invoice_list': 'Danh sách hoá đơn', 'pos.create_sale': 'Tạo đơn',
  },
  en: {
    'nav.dashboard': 'Overview', 'nav.appointments': 'Appointments', 'nav.pos': 'Checkout',
    'nav.customers': 'Customers', 'nav.staff': 'Staff', 'nav.catalog': 'Catalog',
    'nav.reports': 'Reports', 'nav.settings': 'Settings', 'nav.more': 'More', 'nav.all_features': 'All features',
    'nav.discounts': 'Discounts',
    'top.all_branches': 'All branches',
    'common.add': 'Add', 'common.edit': 'Edit', 'common.delete': 'Delete', 'common.save': 'Save',
    'common.cancel': 'Cancel', 'common.loading': 'Loading...', 'common.search': 'Search...', 'common.manage_groups': 'Manage groups',
    'catalog.title': 'Catalog', 'catalog.subtitle': 'Manage services, products, packages, treatments, combos, cards & inventory',
    'catalog.service': 'Services', 'catalog.product': 'Products', 'catalog.package': 'Packages',
    'catalog.treatment': 'Treatments', 'catalog.service_combo': 'Service Combos', 'catalog.product_combo': 'Product Combos',
    'catalog.prepaid_card': 'Prepaid Cards', 'catalog.inventory': 'Inventory',
    'pos.title': 'Checkout', 'pos.invoice_list': 'Invoice list', 'pos.create_sale': 'New Sale',
  },
  zh: {
    'nav.dashboard': '概览', 'nav.appointments': '预约', 'nav.pos': '收银',
    'nav.customers': '客户', 'nav.staff': '员工', 'nav.catalog': '目录',
    'nav.reports': '报告', 'nav.settings': '设置', 'nav.more': '更多', 'nav.all_features': '所有功能',
    'nav.discounts': '折扣',
    'top.all_branches': '所有门店',
    'common.add': '添加', 'common.edit': '编辑', 'common.delete': '删除', 'common.save': '保存',
    'common.cancel': '取消', 'common.loading': '加载中...', 'common.search': '搜索...', 'common.manage_groups': '管理分组',
    'catalog.title': '目录', 'catalog.subtitle': '管理服务、产品、套餐、疗程、组合、卡和库存',
    'catalog.service': '服务', 'catalog.product': '产品', 'catalog.package': '套餐',
    'catalog.treatment': '疗程', 'catalog.service_combo': '服务组合', 'catalog.product_combo': '产品组合',
    'catalog.prepaid_card': '预付卡', 'catalog.inventory': '库存',
    'pos.title': '收银台', 'pos.invoice_list': '发票列表', 'pos.create_sale': '新建订单',
  },
  ko: {
    'nav.dashboard': '개요', 'nav.appointments': '예약', 'nav.pos': '결제',
    'nav.customers': '고객', 'nav.staff': '직원', 'nav.catalog': '카탈로그',
    'nav.reports': '보고서', 'nav.settings': '설정', 'nav.more': '더보기', 'nav.all_features': '전체 기능',
    'nav.discounts': '할인',
    'top.all_branches': '전체 지점',
    'common.add': '추가', 'common.edit': '수정', 'common.delete': '삭제', 'common.save': '저장',
    'common.cancel': '취소', 'common.loading': '로딩중...', 'common.search': '검색...', 'common.manage_groups': '그룹 관리',
    'catalog.title': '카탈로그', 'catalog.subtitle': '서비스, 상품, 패키지, 치료, 콤보, 카드 및 재고 관리',
    'catalog.service': '서비스', 'catalog.product': '상품', 'catalog.package': '패키지',
    'catalog.treatment': '치료', 'catalog.service_combo': '서비스 콤보', 'catalog.product_combo': '상품 콤보',
    'catalog.prepaid_card': '선불카드', 'catalog.inventory': '재고',
    'pos.title': '결제', 'pos.invoice_list': '청구서 목록', 'pos.create_sale': '신규 주문',
  },
  ja: {
    'nav.dashboard': '概要', 'nav.appointments': '予約', 'nav.pos': 'レジ',
    'nav.customers': '顧客', 'nav.staff': 'スタッフ', 'nav.catalog': 'カタログ',
    'nav.reports': 'レポート', 'nav.settings': '設定', 'nav.more': 'その他', 'nav.all_features': '全機能',
    'nav.discounts': '割引',
    'top.all_branches': '全店舗',
    'common.add': '追加', 'common.edit': '編集', 'common.delete': '削除', 'common.save': '保存',
    'common.cancel': 'キャンセル', 'common.loading': '読み込み中...', 'common.search': '検索...', 'common.manage_groups': 'グループ管理',
    'catalog.title': 'カタログ', 'catalog.subtitle': 'サービス、商品、パッケージ、治療、コンボ、カード、在庫を管理',
    'catalog.service': 'サービス', 'catalog.product': '商品', 'catalog.package': 'パッケージ',
    'catalog.treatment': '治療', 'catalog.service_combo': 'サービスコンボ', 'catalog.product_combo': '商品コンボ',
    'catalog.prepaid_card': 'プリペイドカード', 'catalog.inventory': '在庫',
    'pos.title': 'レジ', 'pos.invoice_list': '請求書一覧', 'pos.create_sale': '新規注文',
  },
};

const LanguageContext = createContext({
  lang: 'vi',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('app_lang') || 'vi') : 'vi');

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('app_lang', lang);
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.en?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: 'vi', setLang: () => {}, t: (k) => k };
  return ctx;
}