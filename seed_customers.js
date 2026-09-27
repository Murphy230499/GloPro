const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CUSTOMER_GROUPS = [
  { name: 'VIP', color: '#FBBF24', description: 'Khách hàng cao cấp, chi tiêu trên 5 triệu' },
  { name: 'Thân thiết', color: '#60A5FA', description: 'Khách hàng thường xuyên, trên 5 lần ghé thăm' },
  { name: 'Khách mới', color: '#34D399', description: 'Khách hàng mới đăng ký' },
];

const CUSTOMERS = [
  // VIP
  { full_name: 'Nguyễn Thị Thanh Hương', phone: '0901111001', email: 'huong.vip@gmail.com', gender: 'female', birth_date: '1985-03-15', address: '12 Nguyễn Huệ, Q.1, TP.HCM', note: 'Thích màu tím và hồng, dị ứng hóa chất mạnh', points: 2500, group: 'VIP' },
  { full_name: 'Trần Minh Quân', phone: '0901111002', email: 'quan.boss@gmail.com', gender: 'male', birth_date: '1980-07-22', address: '88 Lê Lợi, Q.1, TP.HCM', note: 'Khách VIP, ưu tiên phục vụ nhanh', points: 1800, group: 'VIP' },

  // Thân thiết
  { full_name: 'Lê Thị Bích Ngọc', phone: '0912222001', email: '', gender: 'female', birth_date: '1993-05-10', address: '', note: 'Hay đến cuối tuần, thích gội dưỡng sinh', points: 850, group: 'Thân thiết' },
  { full_name: 'Phạm Văn Hùng', phone: '0912222002', email: '', gender: 'male', birth_date: '1990-11-30', address: 'Quận Bình Thạnh, TP.HCM', note: 'Cắt tóc mỗi tháng 1 lần', points: 620, group: 'Thân thiết' },
  { full_name: 'Võ Thị Thu Lan', phone: '0912222003', email: 'thulan93@gmail.com', gender: 'female', birth_date: '1993-08-18', address: '', note: 'Nail thường xuyên, hay làm nails vào thứ 6', points: 1150, group: 'Thân thiết' },
  { full_name: 'Đỗ Thị Mỹ Linh', phone: '0912222004', email: '', gender: 'female', birth_date: '1998-02-14', address: 'Q.7, TP.HCM', note: 'Sinh viên, hay mua combo tiết kiệm', points: 430, group: 'Thân thiết' },
  { full_name: 'Hoàng Văn Tuấn', phone: '0912222005', email: '', gender: 'male', birth_date: '1987-09-05', address: '', note: 'Làm spa mỗi 2 tuần', points: 780, group: 'Thân thiết' },

  // Khách mới
  { full_name: 'Bùi Thị Ngân', phone: '0923333001', email: '', gender: 'female', birth_date: '2000-04-20', address: '', note: '', points: 50, group: 'Khách mới' },
  { full_name: 'Ngô Thành Đạt', phone: '0923333002', email: 'dat2000@gmail.com', gender: 'male', birth_date: '1999-12-01', address: '', note: 'Được giới thiệu từ bạn', points: 0, group: 'Khách mới' },
  { full_name: 'Trịnh Thị Hoa', phone: '0923333003', email: '', gender: 'female', birth_date: '1995-06-25', address: 'Quận Gò Vấp, TP.HCM', note: '', points: 120, group: 'Khách mới' },
  { full_name: 'Lý Văn Phúc', phone: '0923333004', email: '', gender: 'male', birth_date: '1992-01-08', address: '', note: 'Khách Google Maps', points: 0, group: 'Khách mới' },
  { full_name: 'Đinh Thị Kim Anh', phone: '0923333005', email: 'kimanh.beauty@gmail.com', gender: 'female', birth_date: '2001-10-15', address: '', note: 'Hay hỏi về dịch vụ nail', points: 80, group: 'Khách mới' },
];

async function api(table, data) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation' // Return inserted row
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    console.error(`Failed to insert into ${table}:`, await res.text());
    return null;
  }
  const result = await res.json();
  return result[0];
}

async function run() {
  const newId = '6cb88c32-06c6-4b95-b286-99bc8c141c79'; // target tenant
  
  // 1. Insert Groups
  const groupIdMap = {};
  for (const g of CUSTOMER_GROUPS) {
    const row = await api('customergroup', {
      name: g.name,
      color: g.color,
      tenant_id: newId
    });
    if (row) {
      groupIdMap[g.name] = row.id;
    }
  }

  // 2. Insert Customers
  let count = 0;
  for (const c of CUSTOMERS) {
    const { group, full_name, birth_date, ...rest } = c;
    await api('customer', {
      ...rest,
      birthday: birth_date,
      name: full_name,
      tenant_id: newId,
      group_id: groupIdMap[group] || null
    });
    count++;
  }
  
  console.log(`Successfully seeded ${count} customers for tenant ${newId}`);
}

run();
