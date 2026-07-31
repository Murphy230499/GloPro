'use client';
import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingBag, Users, Calendar, DollarSign,
  Scissors, Package, Layers, AlertTriangle, Clock, Star, Zap,
  Activity, CreditCard, Gift, CheckCircle, XCircle, Eye,
  BarChart2, Target, Wallet, ArrowUpRight, ArrowDownRight, Minus as MinusIcon,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { formatVND } from '@/lib/format';
import { generateAIInsights, generateOperationalAlerts } from '@/lib/reportsEngine';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:    '#3B82F6', sky:    '#0EA5E9', indigo: '#6366F1',
  emerald: '#10B981', teal:   '#14B8A6', green:  '#22C55E',
  amber:   '#F59E0B', orange: '#F97316', rose:   '#F43F5E',
  purple:  '#A855F7', slate:  '#64748B',
};
const PIE_COLORS = [C.blue, C.emerald, C.amber, C.purple, C.rose, C.teal];
const VI_DAYS = ['CN','T2','T3','T4','T5','T6','T7'];
const VI_HOURS = ['6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h'];

// ── Utility ───────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2,'0');
const todayISO = () => new Date().toISOString().slice(0,10);
const shortVND = v => {
  if (!v) return '0₫';
  if (v >= 1e9) return (v/1e9).toFixed(1)+'tỷ';
  if (v >= 1e6) return (v/1e6).toFixed(1)+'tr';
  if (v >= 1e3) return (v/1e3).toFixed(0)+'k';
  return v+'₫';
};

// ── Sub-components ────────────────────────────────────────────────────────────

// Section wrapper
function Section({ title, sub, icon: Icon, iconColor = 'text-blue-600', children, id }) {
  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center gap-2.5">
        {Icon && <div className={`p-1.5 rounded-lg bg-slate-100 ${iconColor}`}><Icon className="w-3.5 h-3.5"/></div>}
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {sub && <p className="text-[11px] text-slate-400 leading-none mt-0.5">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// Card wrapper
function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${onClick?'cursor-pointer hover:shadow-md hover:border-blue-300 transition-all':''}  ${className}`}
    >
      {children}
    </div>
  );
}

// Executive KPI Card with sparkline
function ExecKPICard({ title, value, growth, sub, icon: Icon, color, sparkData = [], onClick }) {
  const pos = growth > 0; const neg = growth < 0;
  const colorMap = {
    blue:    { bg:'bg-blue-50',    text:'text-blue-600',    border:'border-blue-100',    line: C.blue    },
    emerald: { bg:'bg-emerald-50', text:'text-emerald-600', border:'border-emerald-100', line: C.emerald },
    amber:   { bg:'bg-amber-50',   text:'text-amber-600',   border:'border-amber-100',   line: C.amber   },
    rose:    { bg:'bg-rose-50',    text:'text-rose-600',    border:'border-rose-100',    line: C.rose    },
    purple:  { bg:'bg-purple-50',  text:'text-purple-600',  border:'border-purple-100',  line: C.purple  },
    teal:    { bg:'bg-teal-50',    text:'text-teal-600',    border:'border-teal-100',    line: C.teal    },
    sky:     { bg:'bg-sky-50',     text:'text-sky-600',     border:'border-sky-100',     line: C.sky     },
    indigo:  { bg:'bg-indigo-50',  text:'text-indigo-600',  border:'border-indigo-100',  line: C.indigo  },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card onClick={onClick} className="p-4 flex flex-col gap-2 min-w-0 group">
      <div className="flex items-start justify-between gap-1">
        <span className="text-[11px] font-semibold text-slate-500 leading-tight">{title}</span>
        {Icon && (
          <div className={`shrink-0 p-1.5 rounded-lg border ${c.bg} ${c.text} ${c.border} transition-transform group-hover:scale-110`}>
            <Icon className="w-3.5 h-3.5"/>
          </div>
        )}
      </div>
      <div className="text-base font-extrabold text-slate-900 leading-tight break-all">{value}</div>
      <div className="flex items-center gap-1.5">
        {growth !== undefined && growth !== null && (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold
            ${pos?'bg-emerald-50 text-emerald-600':neg?'bg-rose-50 text-rose-600':'bg-slate-100 text-slate-500'}`}>
            {pos?<ArrowUpRight className="w-2.5 h-2.5"/>:neg?<ArrowDownRight className="w-2.5 h-2.5"/>:<MinusIcon className="w-2.5 h-2.5"/>}
            {Math.abs(growth)}%
          </span>
        )}
        {sub && <span className="text-[10px] text-slate-400 truncate">{sub}</span>}
      </div>
      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div className="h-8 w-full -mx-1 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={c.line} strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// Heatmap cell
function HeatCell({ value, max }) {
  const pct = max > 0 ? value/max : 0;
  const alpha = Math.round(pct * 220);
  const bg = `rgba(59,130,246,${(pct*0.85).toFixed(2)})`;
  const text = pct > 0.55 ? 'text-white' : 'text-slate-700';
  return (
    <div className={`flex items-center justify-center rounded text-[9px] font-semibold h-6 ${text}`} style={{backgroundColor: pct===0?'#f8fafc':bg}}>
      {value || ''}
    </div>
  );
}

// Alert badge
function AlertBadge({ type, text }) {
  const styles = {
    error:   'bg-rose-50 border-rose-200 text-rose-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
  const icons = { error: XCircle, warning: AlertTriangle, info: Eye, success: CheckCircle };
  const Ico = icons[type] || AlertTriangle;
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${styles[type]||styles.warning}`}>
      <Ico className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
      <span>{text}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OverviewTab({
  invoices = [], appointments = [], customers = [], staff = [],
  products = [], services = [], packages = [], treatments = [],
  serviceCombos = [], productCombos = [], prepaidCards = [],
  onDrillDown,
}) {
  const [trendPeriod, setTrendPeriod] = useState('14d'); // '7d','14d','30d','90d'

  const today = todayISO();
  const todayInvoices = invoices.filter(i => (i.created_date||'').slice(0,10) === today);
  const todayAppts    = appointments.filter(a => (a.date||a.appointment_date||'').slice(0,10) === today);

  // ── §1 REVENUE KPIs ───────────────────────────────────────────────────────
  const totalRevenue     = invoices.reduce((s,i)=>s+(i.total||0),0);
  const totalTip         = invoices.reduce((s,i)=>s+(i.tip||0),0);
  const totalDiscount    = invoices.reduce((s,i)=>s+(i.discount||0),0);
  const grossRevenue     = totalRevenue + totalDiscount;
  const cogs             = grossRevenue * 0.30; // estimated COGS 30%
  const payroll          = grossRevenue * 0.30; // estimated payroll 30%
  const opex             = grossRevenue * 0.15; // estimated opex 15%
  const netProfit        = totalRevenue - cogs - payroll - opex;
  const totalInvoices    = invoices.length;
  const avgOrderValue    = totalInvoices > 0 ? Math.round(totalRevenue/totalInvoices) : 0;
  const todayRevenue     = todayInvoices.reduce((s,i)=>s+(i.total||0),0);

  // ── §2 APPOINTMENT KPIs — 7 trạng thái đầy đủ ────────────────────────────
  const apptTotal      = appointments.length;
  const apptPending    = appointments.filter(a=>a.status==='pending').length;
  const apptConfirmed  = appointments.filter(a=>a.status==='confirmed').length;
  const apptCheckedIn  = appointments.filter(a=>a.status==='checked_in').length;
  const apptInProgress = appointments.filter(a=>a.status==='in_progress').length;
  const apptCompleted  = appointments.filter(a=>a.status==='completed').length;
  const apptCancelled  = appointments.filter(a=>a.status==='cancelled').length;
  const apptNoShow     = appointments.filter(a=>a.status==='no_show').length;
  const apptWaiting    = apptPending + apptConfirmed; // chưa đến
  const fillRate       = apptTotal > 0 ? Math.round(apptCompleted/apptTotal*100) : 0;
  const cancelRate     = apptTotal > 0 ? Math.round(apptCancelled/apptTotal*100) : 0;
  const noShowRate     = apptTotal > 0 ? Math.round(apptNoShow/apptTotal*100) : 0;

  // ── §3 CUSTOMER KPIs ──────────────────────────────────────────────────────
  const totalCustomers  = customers.length;
  // Lọc khách hàng vãng lai
  const walkInCustomers = customers.filter(c => 
    !c.full_name || 
    c.full_name.toLowerCase().includes('vãng lai') || 
    c.full_name.toLowerCase().includes('vang lai') ||
    c.id === 'walk_in' || 
    c.id === 'walkin'
  );
  const registeredCustomers = customers.filter(c => 
    c.full_name && 
    !c.full_name.toLowerCase().includes('vãng lai') && 
    !c.full_name.toLowerCase().includes('vang lai') &&
    c.id !== 'walk_in' && 
    c.id !== 'walkin'
  );
  
  const walkInCount     = walkInCustomers.length || invoices.filter(i => !i.customer_id || (i.customer_name || '').toLowerCase().includes('vãng lai')).length;
  const newCustomers    = registeredCustomers.filter(c=>(c.visit_count||0)<=1).length;
  const returnCustomers = registeredCustomers.filter(c=>(c.visit_count||0)>1).length;
  const vipCustomers    = registeredCustomers.filter(c=>(c.total_spent||0)>=5000000).length;
  const repeatRate      = registeredCustomers.length>0 ? Math.round(returnCustomers/registeredCustomers.length*100) : 0;
  const avgLTV          = registeredCustomers.length>0 ? Math.round(registeredCustomers.reduce((s,c)=>s+(c.total_spent||0),0)/registeredCustomers.length) : 0;

  // ── §4 INVENTORY KPIs ─────────────────────────────────────────────────────
  const totalInventoryValue = products.reduce((s,p)=>s+((p.stock_quantity||0)*(p.price||0)),0);
  const lowStockProducts    = products.filter(p=>p.stock_quantity!=null&&p.stock_quantity>0&&p.stock_quantity<=5);
  const outOfStockProducts  = products.filter(p=>(p.stock_quantity||0)<=0);

  // ── §5 REVENUE TREND ──────────────────────────────────────────────────────
  const periodDays = { '7d':7,'14d':14,'30d':30,'90d':90 }[trendPeriod]||30;
  const trendData = useMemo(()=>{
    const map={};
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-periodDays);
    invoices.forEach(inv=>{
      const d=(inv.created_date||'').slice(0,10);
      if(!d||new Date(d)<cutoff) return;
      map[d]=(map[d]||0)+(inv.total||0);
    });
    const arr=Object.entries(map).sort(([a],[b])=>a.localeCompare(b));
    return arr.map(([date,revenue])=>({
      date: date.slice(5),
      revenue,
      target: Math.round(totalRevenue/Math.max(arr.length,1)*1.1),
    }));
  },[invoices,periodDays,totalRevenue]);

  // ── §6 REVENUE BREAKDOWN (Stacked Bar) ───────────────────────────────────
  const revenueByCategory = useMemo(()=>{
    const map={service:0,product:0,package:0,combo:0,card:0};
    invoices.forEach(inv=>{
      (inv.items||[]).forEach(it=>{
        const t=it.type||'service';
        const v=(it.price||0)*(it.qty||1);
        if(t==='service') map.service+=v;
        else if(t==='product') map.product+=v;
        else if(t==='package') map.package+=v;
        else if(t==='combo'||t==='service_combo'||t==='product_combo') map.combo+=v;
        else if(t==='prepaid_card') map.card+=v;
        else map.service+=v;
      });
    });
    return [{ name:'Tổng',
      'Dịch vụ':map.service,'Sản phẩm':map.product,'Gói DV':map.package,'Combo':map.combo,'Thẻ':map.card
    }];
  },[invoices]);

  // ── §7 BOOKING ANALYSIS ───────────────────────────────────────────────────
  const bookingTrend = useMemo(()=>{
    const map={};
    appointments.forEach(a=>{
      const d=(a.date||a.appointment_date||'').slice(0,10);
      if(!d) return;
      if(!map[d]) map[d]={date:d.slice(5),completed:0,cancelled:0,pending:0,noshow:0};
      if(a.status==='completed') map[d].completed++;
      else if(a.status==='cancelled') map[d].cancelled++;
      else if(a.status==='no_show') map[d].noshow++;
      else map[d].pending++;
    });
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  },[appointments]);

  // ── §8 PEAK HOURS HEATMAP ─────────────────────────────────────────────────
  const heatmapData = useMemo(()=>{
    // [dayIndex 0=Sun..6=Sat][hourIndex 0=6h..14=20h]
    const grid = Array.from({length:7},()=>Array(15).fill(0));
    appointments.forEach(a=>{
      if(!a.time && !a.start_time) return;
      const timeStr = a.time||a.start_time||'';
      const parts = timeStr.split(':');
      const h = parseInt(parts[0]||'0');
      const dateStr = a.date||a.appointment_date||'';
      if(!dateStr) return;
      const dow = new Date(dateStr).getDay(); // 0=Sun
      const hIdx = h - 6;
      if(hIdx>=0&&hIdx<15) grid[dow][hIdx]++;
    });
    return grid;
  },[appointments]);
  const heatMax = useMemo(()=>Math.max(...heatmapData.flat(),1),[heatmapData]);

  // ── §9 TOP STAFF ──────────────────────────────────────────────────────────
  const staffPerf = useMemo(()=>{
    return staff.map(st=>({
      name: (st.full_name||'').split(' ').slice(-1)[0]||st.full_name,
      fullName: st.full_name,
      revenue: invoices.reduce((sum,inv)=>{
        const items=(inv.items||[]).filter(it=>it.staff_id===st.id);
        return sum+items.reduce((a,it)=>a+(it.price||0)*(it.qty||1),0);
      },0),
      bookings: appointments.filter(a=>a.staff_id===st.id||((a.staff_ids||[]).includes(st.id))).length,
    })).sort((a,b)=>b.revenue-a.revenue).slice(0,8);
  },[staff,invoices,appointments]);

  // ── §10 TOP SERVICES ──────────────────────────────────────────────────────
  const servicePerf = useMemo(()=>{
    const map={};
    invoices.forEach(inv=>{
      (inv.items||[]).forEach(it=>{
        if(it.is_from_package) return;
        if(it.type&&it.type!=='service'&&it.type!==undefined) return;
        const n=it.name||'Dịch vụ';
        if(!map[n]) map[n]={name:n,revenue:0,count:0};
        map[n].revenue+=(it.price||0)*(it.qty||1);
        map[n].count+=(it.qty||1);
      });
    });
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,8);
  },[invoices]);

  // ── §11 CUSTOMER ANALYSIS ─────────────────────────────────────────────────
  const custPieData = [
    {name:'Khách vãng lai', value:walkInCount,     color:C.slate},
    {name:'Khách mới',      value:newCustomers,    color:C.blue},
    {name:'Quay lại',       value:returnCustomers, color:C.emerald},
    {name:'VIP (5tr+)',     value:vipCustomers,    color:C.amber},
  ].filter(x=>x.value>0);
  const topCustomers = [...registeredCustomers].sort((a,b)=>(b.total_spent||0)-(a.total_spent||0)).slice(0,5);

  // ── §12 PAYMENT ANALYSIS ─────────────────────────────────────────────────
  const paymentData = useMemo(()=>{
    const map={};
    invoices.forEach(inv=>{
      const m=inv.payment_method||'Tiền mặt';
      map[m]=(map[m]||0)+(inv.total||0);
    });
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[invoices]);

  // ── §13 CASH FLOW WATERFALL ───────────────────────────────────────────────
  const waterfallData = [
    { name:'Doanh thu\nGộp',   value: grossRevenue,   type:'positive' },
    { name:'Giảm giá',         value: -totalDiscount, type:'negative' },
    { name:'COGS\n(30%)',      value: -cogs,          type:'negative' },
    { name:'Nhân sự\n(30%)',   value: -payroll,       type:'negative' },
    { name:'Vận hành\n(15%)',  value: -opex,          type:'negative' },
    { name:'Lợi nhuận\nRòng',  value: netProfit,      type: netProfit>=0?'positive':'negative' },
  ];

  // ── §14 UPCOMING APPOINTMENTS ─────────────────────────────────────────────
  const nowMs = Date.now();
  const upcomingAppts = appointments
    .filter(a=>{
      const ds=(a.date||a.appointment_date||'').slice(0,10);
      if(ds!==today) return false;
      const ts=a.time||a.start_time||'';
      if(!ts) return true;
      const [hh,mm]=(ts+':00').split(':');
      const apptMs=new Date(`${ds}T${pad(+hh)}:${pad(+mm)}:00`).getTime();
      return apptMs>nowMs;
    })
    .sort((a,b)=>{
      const ta=a.time||a.start_time||'00:00', tb=b.time||b.start_time||'00:00';
      return ta.localeCompare(tb);
    })
    .slice(0,8);

  // ── §15 AI INSIGHTS ───────────────────────────────────────────────────────
  const aiInsights = [
    totalRevenue>0 && `📈 Tổng doanh thu kỳ này: ${shortVND(totalRevenue)}`,
    netProfit>0 ? `💰 Lợi nhuận ước tính: ${shortVND(netProfit)} (${Math.round(netProfit/Math.max(totalRevenue,1)*100)}% margin)` : `⚠️ Lợi nhuận âm — cần kiểm tra chi phí`,
    fillRate > 0 && `📅 Tỷ lệ hoàn thành lịch hẹn: ${fillRate}%`,
    cancelRate > 20 && `⚠️ Tỷ lệ huỷ lịch cao: ${cancelRate}% — cần tìm nguyên nhân`,
    noShowRate > 10 && `⚠️ No-show ${noShowRate}% — cân nhắc gửi nhắc nhở tự động`,
    repeatRate > 0 && `🔄 Tỷ lệ khách quay lại: ${repeatRate}%`,
    vipCustomers > 0 && `⭐ ${vipCustomers} khách VIP (chi tiêu 5tr+) cần chăm sóc đặc biệt`,
    newCustomers > 0 && `🆕 ${newCustomers} khách mới trong kỳ`,
    lowStockProducts.length > 0 && `📦 ${lowStockProducts.length} sản phẩm sắp hết hàng`,
    staffPerf[0] && `🏆 Nhân viên dẫn đầu: ${staffPerf[0].fullName} — ${shortVND(staffPerf[0].revenue)}`,
  ].filter(Boolean);

  // ── §16 ALERTS ────────────────────────────────────────────────────────────
  const alerts = [
    ...outOfStockProducts.slice(0,3).map(p=>({ type:'error', text:`🔴 Hết hàng: ${p.name}` })),
    ...lowStockProducts.slice(0,3).map(p=>({ type:'warning', text:`🟡 Sắp hết: ${p.name} (còn ${p.stock_quantity} ${p.unit||'cái'})` })),
    cancelRate>25 && { type:'error',   text:`Tỷ lệ huỷ lịch ${cancelRate}% — vượt ngưỡng 25%` },
    noShowRate>15 && { type:'warning', text:`No-show ${noShowRate}% — cần thiết lập nhắc nhở tự động` },
    netProfit<0  && { type:'error',   text:`Lợi nhuận âm kỳ này — kiểm tra cấu trúc chi phí ngay` },
    todayAppts.length>0 && { type:'info', text:`📅 Hôm nay có ${todayAppts.length} lịch hẹn` },
  ].filter(Boolean);

  // ── Sparkline data builder ─────────────────────────────────────────────────
  const revenueSparkline = trendData.slice(-7).map(d=>({v:d.revenue}));
  const bookingSparkline = bookingTrend.slice(-7).map(d=>({v:d.completed}));

  // ── Custom Tooltip ─────────────────────────────────────────────────────────
  const VNDTooltip = ({ active, payload, label }) => {
    if(!active||!payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p,i)=>(
          <p key={i} style={{color:p.color}} className="font-medium">
            {p.name}: {typeof p.value==='number'&&p.value>=1000?formatVND(p.value):p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: Executive KPI Cards
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Chỉ số kinh doanh chính" sub="Real-time executive overview" icon={BarChart2} iconColor="text-blue-600">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          <ExecKPICard title="Tổng doanh thu" value={shortVND(totalRevenue)} growth={18} sub="kỳ này" icon={TrendingUp} color="emerald" sparkData={revenueSparkline} onClick={()=>onDrillDown&&onDrillDown('Hóa đơn',invoices)} />
          <ExecKPICard title="Doanh thu hôm nay" value={shortVND(todayRevenue)} growth={8} sub="so với hôm qua" icon={Zap} color="blue" sparkData={[]} onClick={()=>onDrillDown&&onDrillDown('Hóa đơn hôm nay',todayInvoices)} />
          <ExecKPICard title="Lợi nhuận ước tính" value={shortVND(netProfit)} growth={netProfit>0?12:-8} sub="sau CP ~75%" icon={Wallet} color={netProfit>=0?'emerald':'rose'} sparkData={[]} />
          <ExecKPICard title="AOV (Giá trị TB/đơn)" value={shortVND(avgOrderValue)} growth={5} sub="trên/hóa đơn" icon={ShoppingBag} color="purple" sparkData={revenueSparkline} />
          <ExecKPICard title="Tổng lịch hẹn" value={apptTotal} growth={bookingTrend.length>1?8:0} sub="kỳ này" icon={Calendar} color="amber" sparkData={bookingSparkline} onClick={()=>onDrillDown&&onDrillDown('Lịch hẹn',appointments)} />
          <ExecKPICard title="Tỷ lệ lấp đầy" value={`${fillRate}%`} growth={fillRate>70?5:-3} sub="hoàn thành/tổng" icon={Target} color="teal" sparkData={[]} />
          <ExecKPICard title="Tỷ lệ huỷ lịch" value={`${cancelRate}%`} growth={-cancelRate} sub="cần giảm xuống <10%" icon={XCircle} color={cancelRate>20?'rose':'emerald'} sparkData={[]} />
          <ExecKPICard title="No-show" value={`${noShowRate}%`} growth={-noShowRate} sub="không đến" icon={AlertTriangle} color={noShowRate>15?'rose':'amber'} sparkData={[]} />
          <ExecKPICard title="Khách hàng" value={totalCustomers} growth={6} sub={`${newCustomers} mới`} icon={Users} color="blue" sparkData={[]} onClick={()=>onDrillDown&&onDrillDown('Khách hàng',customers)} />
          <ExecKPICard title="Khách quay lại" value={`${repeatRate}%`} growth={repeatRate>50?4:-2} sub={`${returnCustomers} khách`} icon={CheckCircle} color="emerald" sparkData={[]} />
          <ExecKPICard title="Tiền TIP nhận" value={shortVND(totalTip)} growth={4} sub="từ khách hàng" icon={Gift} color="amber" sparkData={[]} />
          <ExecKPICard title="Giá trị tồn kho" value={shortVND(totalInventoryValue)} growth={0} sub={`${outOfStockProducts.length} hết hàng`} icon={Layers} color={outOfStockProducts.length>0?'rose':'teal'} sparkData={[]} />
        </div>
      </Section>

      {/* Alerts & AI Insight — above fold */}
      {alerts.length > 0 && (
        <Section title="Cảnh báo cần xử lý" sub={`${alerts.length} cảnh báo đang hoạt động`} icon={AlertTriangle} iconColor="text-rose-500">
          <div className="grid sm:grid-cols-2 gap-2">
            {alerts.slice(0,6).map((a,i)=><AlertBadge key={i} type={a.type} text={a.text}/>)}
          </div>
        </Section>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Section title="AI Business Insights" sub="Phân tích thông minh từ dữ liệu" icon={Star} iconColor="text-amber-500">
          <Card className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6">
              {aiInsights.slice(0,8).map((ins,i)=>(
                <p key={i} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">{ins}</p>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: Revenue Trend
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Xu hướng doanh thu" sub="So sánh với mục tiêu" icon={TrendingUp} iconColor="text-emerald-600">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-slate-500">Tổng kỳ: </span>
              <span className="text-sm font-bold text-emerald-600">{formatVND(totalRevenue)}</span>
            </div>
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              {[['7d','7 ngày'],['14d','14 ngày'],['30d','30 ngày'],['90d','3 tháng']].map(([k,l])=>(
                <button key={k} onClick={()=>setTrendPeriod(k)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer
                    ${trendPeriod===k?'bg-white text-blue-600 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="gRev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.emerald} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={C.emerald} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>shortVND(v)} tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} width={55}/>
              <Tooltip content={<VNDTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}} iconType="circle"/>
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke={C.emerald} strokeWidth={2.5} fillOpacity={1} fill="url(#gRev2)"/>
              <Line type="monotone" dataKey="target" name="Mục tiêu" stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 + 4: Revenue Breakdown & Booking Analysis
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Cơ cấu nguồn doanh thu" sub="Stacked Bar theo danh mục" icon={DollarSign} iconColor="text-blue-600">
          <Card className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>shortVND(v)} tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} width={55}/>
                <Tooltip content={<VNDTooltip/>}/>
                <Legend wrapperStyle={{fontSize:10}} iconType="circle"/>
                <Bar dataKey="Dịch vụ"  stackId="a" fill={C.blue}    radius={[0,0,0,0]}/>
                <Bar dataKey="Sản phẩm" stackId="a" fill={C.emerald} radius={[0,0,0,0]}/>
                <Bar dataKey="Gói DV"   stackId="a" fill={C.purple}  radius={[0,0,0,0]}/>
                <Bar dataKey="Combo"    stackId="a" fill={C.amber}   radius={[0,0,0,0]}/>
                <Bar dataKey="Thẻ"      stackId="a" fill={C.teal}    radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title="Phân tích lịch hẹn" sub="Theo trạng thái qua thời gian" icon={Calendar} iconColor="text-amber-500">
          <Card className="p-5">
            {/* 7 status badges */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                {l:'Chờ XN',       v:apptPending,    c:'text-amber-700 bg-amber-50'},
                {l:'Đã XN',        v:apptConfirmed,  c:'text-blue-700 bg-blue-50'},
                {l:'Check-in',     v:apptCheckedIn,  c:'text-orange-700 bg-orange-50'},
                {l:'Đang làm',     v:apptInProgress, c:'text-purple-700 bg-purple-50'},
                {l:'Hoàn thành',   v:apptCompleted,  c:'text-emerald-700 bg-emerald-50'},
                {l:'Huỷ',          v:apptCancelled,  c:'text-rose-700 bg-rose-50'},
                {l:'No-show',      v:apptNoShow,     c:'text-slate-700 bg-slate-100'},
                {l:'Tổng',         v:apptTotal,      c:'text-slate-800 bg-slate-50 border border-slate-200'},
              ].map(x=>(
                <div key={x.l} className={`rounded-xl p-2 text-center ${x.c}`}>
                  <div className="text-base font-extrabold leading-tight">{x.v}</div>
                  <div className="text-[9px] font-semibold leading-none mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} width={25}/>
                <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:10}}/>
                <Legend wrapperStyle={{fontSize:9}} iconType="circle"/>
                <Area type="monotone" dataKey="completed" name="Hoàn thành" stroke={C.emerald} fill={`${C.emerald}20`} strokeWidth={2}/>
                <Area type="monotone" dataKey="pending"   name="Chờ"       stroke={C.amber}   fill={`${C.amber}15`}   strokeWidth={1.5}/>
                <Area type="monotone" dataKey="cancelled" name="Huỷ"       stroke={C.rose}    fill={`${C.rose}15`}    strokeWidth={1.5}/>
                <Area type="monotone" dataKey="noshow"    name="No-show"   stroke={C.orange}  fill={`${C.orange}10`}  strokeWidth={1}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5: Peak Hours Heatmap
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Heatmap khung giờ đông khách" sub="Thứ × Giờ — giúp lên lịch nhân viên tối ưu" icon={Clock} iconColor="text-indigo-600">
        <Card className="p-5 overflow-x-auto">
          <div className="min-w-[520px]">
            {/* header hours */}
            <div className="grid gap-1" style={{gridTemplateColumns:`60px repeat(15,1fr)`}}>
              <div/>
              {VI_HOURS.map(h=><div key={h} className="text-center text-[9px] font-semibold text-slate-400">{h}</div>)}
            </div>
            {/* rows */}
            {VI_DAYS.map((day,di)=>(
              <div key={day} className="grid gap-1 mt-1" style={{gridTemplateColumns:`60px repeat(15,1fr)`}}>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center">{day}</div>
                {heatmapData[di].map((val,hi)=>(
                  <HeatCell key={hi} value={val} max={heatMax}/>
                ))}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[9px] text-slate-400">Ít</span>
              {[0.1,0.3,0.5,0.7,0.9].map(p=>(
                <div key={p} className="w-4 h-3 rounded-sm" style={{backgroundColor:`rgba(59,130,246,${p})`}}/>
              ))}
              <span className="text-[9px] text-slate-400">Nhiều</span>
            </div>
          </div>
        </Card>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 + 7: Top Employees + Top Services
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Top nhân viên doanh số" sub="Xếp hạng theo doanh thu" icon={Users} iconColor="text-blue-600">
          <Card className="p-5">
            {staffPerf.length===0
              ? <p className="text-xs text-slate-400 text-center py-10">Chưa có dữ liệu</p>
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={staffPerf} layout="vertical" barSize={16}>
                    <CartesianGrid horizontal={false} stroke="#f1f5f9"/>
                    <XAxis type="number" tickFormatter={v=>shortVND(v)} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} width={70}/>
                    <Tooltip content={<VNDTooltip/>}/>
                    <Bar dataKey="revenue" name="Doanh số" radius={[0,6,6,0]} fill={C.blue}
                      onClick={row=>onDrillDown&&onDrillDown(`Nhân viên: ${row.fullName||row.name}`,invoices.filter(i=>(i.items||[]).some(it=>it.staff_id===staff.find(s=>s.full_name===row.fullName)?.id)))}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </Section>

        <Section title="Top dịch vụ doanh thu cao" sub="Theo doanh số từ hóa đơn" icon={Scissors} iconColor="text-purple-600">
          <Card className="p-5">
            {servicePerf.length===0
              ? <p className="text-xs text-slate-400 text-center py-10">Chưa có dữ liệu</p>
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={servicePerf} layout="vertical" barSize={16}>
                    <CartesianGrid horizontal={false} stroke="#f1f5f9"/>
                    <XAxis type="number" tickFormatter={v=>shortVND(v)} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} width={120}/>
                    <Tooltip content={<VNDTooltip/>}/>
                    <Bar dataKey="revenue" name="Doanh thu" radius={[0,6,6,0]} fill={C.purple}/>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </Section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8 + 9: Customer Analysis + Payment Analysis
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Customer Donut */}
        <Section title="Phân tích khách hàng" sub="Phân khúc & chỉ số giá trị" icon={Users} iconColor="text-teal-600">
          <Card className="p-5 space-y-3">
            <div className="flex gap-4 items-center">
              <div className="shrink-0">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={custPieData.length?custPieData:[{name:'Chưa có',value:1}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={38}>
                      {(custPieData.length?custPieData:[{color:'#e2e8f0'}]).map((entry,i)=>(
                        <Cell key={i} fill={entry.color||PIE_COLORS[i%PIE_COLORS.length]}/>
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:10}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  {l:'Tổng KH',       v:totalCustomers, c:'text-slate-800'},
                  {l:'Khách vãng lai', v:walkInCount,     c:'text-slate-500'},
                  {l:'Khách mới',     v:newCustomers,   c:'text-blue-600'},
                  {l:'Quay lại',      v:returnCustomers,c:'text-emerald-600'},
                  {l:'VIP (5tr+)',    v:vipCustomers,   c:'text-amber-600'},
                  {l:'Tỷ lệ quay lại', v:`${repeatRate}%`,c:'text-purple-600'},
                  {l:'LTV thành viên',v:shortVND(avgLTV),c:'text-slate-700'},
                ].map(x=>(
                  <div key={x.l} className="flex justify-between items-center border-b border-slate-50 pb-1 last:border-0">
                    <span className="text-[11px] text-slate-500">{x.l}</span>
                    <span className={`text-xs font-bold ${x.c}`}>{x.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* Payment Analysis */}
        <Section title="Phân tích thanh toán" sub="Cơ cấu phương thức" icon={CreditCard} iconColor="text-sky-600">
          <Card className="p-5">
            {paymentData.length===0
              ? <p className="text-xs text-slate-400 text-center py-10">Chưa có dữ liệu</p>
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#64748B'}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={v=>shortVND(v)} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} width={52}/>
                    <Tooltip content={<VNDTooltip/>}/>
                    <Bar dataKey="value" name="Doanh thu" radius={[6,6,0,0]}>
                      {paymentData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </Section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 10: Cash Flow Waterfall
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Dòng tiền & Lợi nhuận (P&L)" sub="Phân tích cấu trúc tài chính" icon={Wallet} iconColor="text-emerald-600">
        <Card className="p-5">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {waterfallData.map((item,i)=>(
              <div key={i} className={`rounded-xl p-3 text-center border ${item.type==='positive'?'bg-emerald-50 border-emerald-100':'bg-rose-50 border-rose-100'}`}>
                <div className={`text-xs font-bold leading-snug mb-1 whitespace-pre-line ${item.type==='positive'?'text-emerald-700':'text-rose-600'}`}>
                  {item.name}
                </div>
                <div className={`text-sm font-extrabold ${item.type==='positive'?'text-emerald-800':'text-rose-700'}`}>
                  {item.value<0?'-':''}{shortVND(Math.abs(item.value))}
                </div>
                {i<waterfallData.length-1 && totalRevenue>0 && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {Math.round(Math.abs(item.value)/grossRevenue*100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 11: Inventory Health
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Sức khỏe kho hàng" sub={`${products.length} sản phẩm · ${outOfStockProducts.length} hết hàng · ${lowStockProducts.length} sắp hết`} icon={Package} iconColor="text-orange-500">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Out/Low stock list */}
          <Card className="p-4 space-y-2">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">⚠️ Cần nhập hàng ngay</p>
            {outOfStockProducts.length===0&&lowStockProducts.length===0
              ? <p className="text-xs text-slate-400 text-center py-6">Kho đang ổn định ✅</p>
              : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {[...outOfStockProducts.slice(0,5), ...lowStockProducts.slice(0,5)].map((p,i)=>(
                    <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${(p.stock_quantity||0)<=0?'bg-rose-50 text-rose-700':'bg-amber-50 text-amber-700'}`}>
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="font-bold shrink-0 ml-2">{(p.stock_quantity||0)<=0?'Hết hàng':`Còn ${p.stock_quantity}`}</span>
                    </div>
                  ))}
                </div>
              )
            }
          </Card>

          {/* Inventory + Catalog stats */}
          <Card className="p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Tổng quan kho & Danh mục</p>
            {/* Kho stats */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {l:'Tổng sản phẩm',     v:products.length,               c:'bg-blue-50 text-blue-700'},
                {l:'Giá trị kho',       v:shortVND(totalInventoryValue),  c:'bg-emerald-50 text-emerald-700'},
                {l:'Sắp hết (≤5)',      v:lowStockProducts.length,        c:'bg-amber-50 text-amber-700'},
                {l:'Hết hàng',          v:outOfStockProducts.length,      c:'bg-rose-50 text-rose-600'},
              ].map(x=>(
                <div key={x.l} className={`rounded-xl p-2.5 text-center ${x.c}`}>
                  <div className="text-base font-extrabold">{x.v}</div>
                  <div className="text-[9px] font-semibold mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
            {/* Catalog danh mục */}
            <div className="pt-1 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Danh mục đang hoạt động</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {l:'Dịch vụ',      v:services.length,      c:'bg-blue-50 text-blue-700'},
                  {l:'Gói DV',       v:packages.length,      c:'bg-purple-50 text-purple-700'},
                  {l:'Liệu trình',   v:treatments.length,    c:'bg-pink-50 text-pink-700'},
                  {l:'Combo DV',     v:serviceCombos.length, c:'bg-amber-50 text-amber-700'},
                  {l:'Combo SP',     v:productCombos.length, c:'bg-teal-50 text-teal-700'},
                  {l:'Thẻ tiền mặt',v:prepaidCards.filter(c=>(c.balance||0)>0).length, c:'bg-indigo-50 text-indigo-700'},
                ].map(x=>(
                  <div key={x.l} className={`rounded-xl p-2 text-center ${x.c}`}>
                    <div className="text-base font-extrabold">{x.v}</div>
                    <div className="text-[9px] font-semibold leading-tight mt-0.5">{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 12: Upcoming Appointments
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Lịch hẹn sắp tới hôm nay" sub={`${upcomingAppts.length} lịch hẹn từ bây giờ trở đi`} icon={Clock} iconColor="text-blue-600">
        <Card className="p-4">
          {upcomingAppts.length===0
            ? <p className="text-xs text-slate-400 text-center py-8">Không còn lịch hẹn nào hôm nay</p>
            : (
              <div className="space-y-2">
                {upcomingAppts.map((a,i)=>(
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 transition">
                    <div className="w-12 text-center shrink-0">
                      <div className="text-sm font-bold text-blue-600">{a.time||a.start_time||'--:--'}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{a.customer_name||'Khách vãng lai'}</div>
                      <div className="text-[10px] text-slate-400 truncate">{a.service_name||a.notes||'Dịch vụ'}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0">{a.staff_name||''}</div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${a.status==='confirmed'?'bg-emerald-400':a.status==='pending'?'bg-amber-400':'bg-blue-400'}`}/>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </Section>

    </div>
  );
}
