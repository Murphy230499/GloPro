import fs from 'fs';

const dict = {
  'settings.title': { vi: 'Cài đặt hệ thống', en: 'System Settings', zh: '系统设置', ko: '시스템 설정', ja: 'システム設定' },
  'settings.subtitle': { vi: 'Cấu hình các phân hệ chi nhánh, tài khoản và quyền hoạt động.', en: 'Configure branch, account, and role modules.', zh: '配置分支机构、帐户和角色模块。', ko: '지점, 계정 및 역할 모듈을 구성합니다.', ja: 'ブランチ、アカウント、およびロールモジュールを構成します。' },
  'settings.tab.branch': { vi: 'Chi nhánh', en: 'Branches', zh: '分支机构', ko: '지점', ja: '店舗' },
  'settings.tab.account': { vi: 'Tài khoản', en: 'Accounts', zh: '帐户', ko: '계정', ja: 'アカウント' },
  'settings.tab.role': { vi: 'Phân quyền', en: 'Permissions', zh: '权限', ko: '권한', ja: '権限' },
  'settings.tab.integration': { vi: 'Tích hợp', en: 'Integrations', zh: '集成', ko: '통합', ja: '連携' },
  'settings.branch.add': { vi: 'Thêm cơ sở', en: 'Add Branch', zh: '添加分支机构', ko: '지점 추가', ja: '店舗追加' },
  'settings.branch.edit': { vi: 'Cấu hình Chi nhánh', en: 'Branch Configuration', zh: '分支机构配置', ko: '지점 구성', ja: '店舗設定' },
  'settings.branch.profile': { vi: 'Hồ sơ chi nhánh', en: 'Branch Profile', zh: '分支机构简介', ko: '지점 프로필', ja: '店舗プロフィール' },
  'settings.branch.social': { vi: 'Mạng xã hội', en: 'Social Media', zh: '社交媒体', ko: '소셜 미디어', ja: 'ソーシャルメディア' },
  'settings.branch.format': { vi: 'Định dạng hiển thị', en: 'Display Format', zh: '显示格式', ko: '표시 형식', ja: '表示形式' },
  'settings.branch.name': { vi: 'Tên chi nhánh', en: 'Branch Name', zh: '分支机构名称', ko: '지점명', ja: '店舗名' },
  'settings.branch.country': { vi: 'Quốc gia', en: 'Country', zh: '国家', ko: '국가', ja: '国' },
  'settings.branch.city': { vi: 'Thành phố / Quận huyện', en: 'City / District', zh: '城市 / 区', ko: '도시 / 구', ja: '市区町村' },
  'settings.branch.state': { vi: 'Tỉnh / Bang', en: 'State / Province', zh: '州 / 省', ko: '주 / 도', ja: '都道府県' },
  'settings.branch.zip': { vi: 'Mã bưu điện', en: 'Zip Code', zh: '邮政编码', ko: '우편번호', ja: '郵便番号' },
  'settings.branch.phone': { vi: 'Số điện thoại', en: 'Phone Number', zh: '电话号码', ko: '전화번호', ja: '電話番号' },
  'settings.branch.address': { vi: 'Địa chỉ chi tiết', en: 'Detailed Address', zh: '详细地址', ko: '상세 주소', ja: '詳細住所' },
  'settings.branch.tax': { vi: 'Mã số thuế', en: 'Tax Code', zh: '税号', ko: '세금 코드', ja: '税務コード' },
  'settings.branch.timezone': { vi: 'Múi giờ', en: 'Timezone', zh: '时区', ko: '시간대', ja: 'タイムゾーン' },
  'settings.branch.date_format': { vi: 'Định dạng ngày', en: 'Date Format', zh: '日期格式', ko: '날짜 형식', ja: '日付形式' },
  'settings.branch.currency': { vi: 'Đơn vị tiền tệ', en: 'Currency', zh: '货币', ko: '통화', ja: '通貨' },
  'settings.branch.language': { vi: 'Ngôn ngữ hiển thị', en: 'Display Language', zh: '显示语言', ko: '표시 언어', ja: '表示言語' },
  'settings.branch.logo': { vi: 'Logo chi nhánh', en: 'Branch Logo', zh: '分支机构标志', ko: '지점 로고', ja: '店舗ロゴ' },
  'settings.branch.working_hours': { vi: 'Giờ hoạt động', en: 'Working Hours', zh: '工作时间', ko: '근무 시간', ja: '営業時間' },
  'settings.branch.general': { vi: 'Thông tin chung', en: 'General Info', zh: '一般信息', ko: '일반 정보', ja: '一般情報' },
  'settings.branch.closed': { vi: 'Đóng cửa', en: 'Closed', zh: '关闭', ko: '닫힘', ja: '閉鎖' },
  'settings.roles.owner': { vi: 'Chủ Salon (Owner)', en: 'Owner', zh: '所有者 (Owner)', ko: '소유자 (Owner)', ja: 'オーナー (Owner)' },
  'settings.roles.admin': { vi: 'Quản trị (Admin)', en: 'Admin', zh: '管理员 (Admin)', ko: '관리자 (Admin)', ja: '管理者 (Admin)' },
  'settings.roles.cashier': { vi: 'Thu ngân', en: 'Cashier', zh: '收银员', ko: '계산원', ja: 'レジ係' },
  'settings.account.add': { vi: 'Thêm tài khoản', en: 'Add Account', zh: '添加帐户', ko: '계정 추가', ja: 'アカウント追加' },
  'settings.account.list': { vi: 'Danh sách tài khoản', en: 'Account List', zh: '帐户列表', ko: '계정 목록', ja: 'アカウント一覧' },
  'settings.success.saved': { vi: 'Đã cập nhật cơ sở', en: 'Branch updated', zh: '分支机构已更新', ko: '지점이 업데이트되었습니다', ja: '店舗が更新されました' },
  'settings.success.added': { vi: 'Đã thêm cơ sở', en: 'Branch added', zh: '添加了分支机构', ko: '지점이 추가되었습니다', ja: '店舗が追加されました' },
  'settings.success.deleted': { vi: 'Đã xóa chi nhánh', en: 'Branch deleted', zh: '分支机构已删除', ko: '지점이 삭제되었습니다', ja: '店舗が削除されました' },
  'settings.error.required': { vi: 'Vui lòng nhập đầy đủ các trường bắt buộc (*)', en: 'Please fill in all required fields (*)', zh: '请填写所有必填字段 (*)', ko: '필수 입력란을 모두 작성해 주세요 (*)', ja: 'すべての必須フィールドに入力してください (*)' },
};

let content = fs.readFileSync('src/lib/i18n.jsx', 'utf8');

['vi', 'en', 'zh', 'ko', 'ja'].forEach(lang => {
  const injection = Object.keys(dict).map(k => `    '${k}': '${dict[k][lang].replace(/'/g, "\\'")}',`).join('\n');
  const regex = new RegExp(`(${lang}: {\\s*)`);
  content = content.replace(regex, `$1\n${injection}\n`);
});

fs.writeFileSync('src/lib/i18n.jsx', content);
console.log('Updated i18n.jsx');
