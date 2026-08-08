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
import { useT } from '@/lib/i18n';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:    '#3B82F6', sky:    '#0EA5E9', indigo: '#6366F1',
  emerald: '#10B981', teal:   '#14B8A6', green:  '#22C55E',
  amber:   '#F59E0B', orange: '#F97316', rose:   '#F43F5E',
  purple:  '#A855F7', slate:  '#64748B',
};
const PIE_COLORS = [C.blue, C.emerald, C.amber, C.purple, C.rose, C.teal];

// ── Utility ───────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2,'0');
const todayISO = () => new Date().toISOString().slice(0,10);
const shortVND = v => {
  if (!v) return '0₫';
  if (v >= 1e9) return (v/1e9).toFixed(1)+'B';
  if (v >= 1e6) return (v/1e6).toFixed(1)+'M';
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
  const t = useT();
  const [trendPeriod, setTrendPeriod] = useState('14d');

  const VI_DAYS = [t('reports.day_sun', 'Sun'), t('reports.day_mon', 'Mon'), t('reports.day_tue', 'Tue'), t('reports.day_wed', 'Wed'), t('reports.day_thu', 'Thu'), t('reports.day_fri', 'Fri'), t('reports.day_sat', 'Sat')];
  const VI_HOURS = ['6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h'];

  const today = todayISO();
  const todayInvoices = invoices.filter(i => (i.created_date||'').slice(0,10) === today);
  const todayAppts    = appointments.filter(a => (a.date||a.appointment_date||'').slice(0,10) === today);

  // ── §1 REVENUE KPIs ───────────────────────────────────────────────────────
  const totalRevenue     = invoices.reduce((s,i)=>s+(i.total||0),0);
  const totalTip         = invoices.reduce((s,i)=>s+(i.tip||0),0);
  const totalDiscount    = invoices.reduce((s,i)=>s+(i.discount||0),0);
  const grossRevenue     = totalRevenue + totalDiscount;
  const cogs             = grossRevenue * 0.30;
  const payroll          = grossRevenue * 0.30;
  const opex             = grossRevenue * 0.15;
  const netProfit        = totalRevenue - cogs - payroll - opex;
  const totalInvoices    = invoices.length;
  const avgOrderValue    = totalInvoices > 0 ? Math.round(totalRevenue/totalInvoices) : 0;
  const todayRevenue     = todayInvoices.reduce((s,i)=>s+(i.total||0),0);

  // ── §2 APPOINTMENT KPIs ───────────────────────────────────────────────────
  const apptTotal      = appointments.length;
  const apptPending    = appointments.filter(a=>a.status==='pending').length;
  const apptConfirmed  = appointments.filter(a=>a.status==='confirmed').length;
  const apptCheckedIn  = appointments.filter(a=>a.status==='checked_in').length;
  const apptInProgress = appointments.filter(a=>a.status==='in_progress').length;
  const apptCompleted  = appointments.filter(a=>a.status==='completed').length;
  const apptCancelled  = appointments.filter(a=>a.status==='cancelled').length;
  const apptNoShow     = appointments.filter(a=>a.status==='no_show').length;
  const fillRate       = apptTotal > 0 ? Math.round(apptCompleted/apptTotal*100) : 0;
  const cancelRate     = apptTotal > 0 ? Math.round(apptCancelled/apptTotal*100) : 0;
  const noShowRate     = apptTotal > 0 ? Math.round(apptNoShow/apptTotal*100) : 0;

  // ── §3 CUSTOMER KPIs ──────────────────────────────────────────────────────
  const totalCustomers  = customers.length;
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
  const catServices = t('reports.cat_services', 'Services');
  const catProducts = t('reports.cat_products', 'Products');
  const catPackages = t('reports.cat_packages', 'Packages');
  const catCombos   = t('reports.cat_combos', 'Combos');
  const catCards    = t('reports.cat_prepaid_cards', 'Prepaid Cards');

  const revenueByCategory = useMemo(()=>{
    const map={service:0,product:0,package:0,combo:0,card:0};
    invoices.forEach(inv=>{
      (inv.items||[]).forEach(it=>{
        const type=it.type||'service';
        const v=(it.price||0)*(it.qty||1);
        if(type==='service') map.service+=v;
        else if(type==='product') map.product+=v;
        else if(type==='package') map.package+=v;
        else if(type==='combo'||type==='service_combo'||type==='product_combo') map.combo+=v;
        else if(type==='prepaid_card') map.card+=v;
        else map.service+=v;
      });
    });
    return [{ name: t('reports.label_total', 'Total'),
      [catServices]:map.service,[catProducts]:map.product,[catPackages]:map.package,[catCombos]:map.combo,[catCards]:map.card
    }];
  },[invoices, catServices, catProducts, catPackages, catCombos, catCards, t]);

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
    const grid = Array.from({length:7},()=>Array(15).fill(0));
    appointments.forEach(a=>{
      if(!a.time && !a.start_time) return;
      const timeStr = a.time||a.start_time||'';
      const parts = timeStr.split(':');
      const h = parseInt(parts[0]||'0');
      const dateStr = a.date||a.appointment_date||'';
      if(!dateStr) return;
      const dow = new Date(dateStr).getDay();
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
        const n=it.name||t('reports.default_service_name', 'Service');
        if(!map[n]) map[n]={name:n,revenue:0,count:0};
        map[n].revenue+=(it.price||0)*(it.qty||1);
        map[n].count+=(it.qty||1);
      });
    });
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,8);
  },[invoices, t]);

  // ── §11 CUSTOMER ANALYSIS ─────────────────────────────────────────────────
  const custPieData = [
    {name: t('reports.walk_in_customer', 'Walk-in Customer'), value:walkInCount,     color:C.slate},
    {name: t('reports.new_customer', 'New Customer'),          value:newCustomers,    color:C.blue},
    {name: t('reports.returning_customer', 'Returning Customer'), value:returnCustomers, color:C.emerald},
    {name: t('reports.vip_customer', 'VIP Customer (5M+)'),   value:vipCustomers,    color:C.amber},
  ].filter(x=>x.value>0);
  const topCustomers = [...registeredCustomers].sort((a,b)=>(b.total_spent||0)-(a.total_spent||0)).slice(0,5);

  // ── §12 PAYMENT ANALYSIS ─────────────────────────────────────────────────
  const paymentData = useMemo(()=>{
    const map={};
    invoices.forEach(inv=>{
      const m=inv.payment_method||t('reports.pm_cash', 'Cash');
      map[m]=(map[m]||0)+(inv.total||0);
    });
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[invoices, t]);

  // ── §13 CASH FLOW WATERFALL ───────────────────────────────────────────────
  const waterfallData = [
    { name: t('reports.wf_gross_rev', 'Gross Revenue'),     value: grossRevenue,   type:'positive' },
    { name: t('reports.wf_discounts', 'Discounts'),         value: -totalDiscount, type:'negative' },
    { name: t('reports.wf_cogs', 'COGS (30%)'),             value: -cogs,          type:'negative' },
    { name: t('reports.wf_payroll', 'Payroll (30%)'),       value: -payroll,       type:'negative' },
    { name: t('reports.wf_opex', 'OPEX (15%)'),             value: -opex,          type:'negative' },
    { name: t('reports.wf_net_profit', 'Net Profit'),       value: netProfit,      type: netProfit>=0?'positive':'negative' },
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
    totalRevenue>0 && t('reports.ai_total_rev', '📈 Total revenue this period: {rev}', { rev: shortVND(totalRevenue) }),
    netProfit>0 
      ? t('reports.ai_net_profit_pos', '💰 Estimated profit: {profit} ({margin}% margin)', { profit: shortVND(netProfit), margin: Math.round(netProfit/Math.max(totalRevenue,1)*100) }) 
      : t('reports.ai_net_profit_neg', '⚠️ Negative profit — review expenses'),
    fillRate > 0 && t('reports.ai_fill_rate', '📅 Appointment completion rate: {rate}%', { rate: fillRate }),
    cancelRate > 20 && t('reports.ai_cancel_rate', '⚠️ High cancellation rate: {rate}% — investigate cause', { rate: cancelRate }),
    noShowRate > 10 && t('reports.ai_noshow_rate', '⚠️ No-show {rate}% — consider automated reminders', { rate: noShowRate }),
    repeatRate > 0 && t('reports.ai_repeat_rate', '🔄 Customer return rate: {rate}%', { rate: repeatRate }),
    vipCustomers > 0 && t('reports.ai_vip_cust', '⭐ {count} VIP customers (5M+) need special care', { count: vipCustomers }),
    newCustomers > 0 && t('reports.ai_new_cust', '🆕 {count} new customers in period', { count: newCustomers }),
    lowStockProducts.length > 0 && t('reports.ai_low_stock', '📦 {count} products running low on stock', { count: lowStockProducts.length }),
    staffPerf[0] && t('reports.ai_top_staff', '🏆 Top staff: {name} — {rev}', { name: staffPerf[0].fullName, rev: shortVND(staffPerf[0].revenue) }),
  ].filter(Boolean);

  // ── §16 ALERTS ────────────────────────────────────────────────────────────
  const alerts = [
    ...outOfStockProducts.slice(0,3).map(p=>({ type:'error', text: t('reports.alert_out_of_stock', '🔴 Out of stock: {name}', { name: p.name }) })),
    ...lowStockProducts.slice(0,3).map(p=>({ type:'warning', text: t('reports.alert_low_stock', '🟡 Low stock: {name} ({count} left)', { name: p.name, count: p.stock_quantity }) })),
    cancelRate>25 && { type:'error',   text: t('reports.alert_cancel_high', 'Cancellation rate {rate}% — exceeds 25% threshold', { rate: cancelRate }) },
    noShowRate>15 && { type:'warning', text: t('reports.alert_noshow_high', 'No-show {rate}% — set up automated reminders', { rate: noShowRate }) },
    netProfit<0  && { type:'error',   text: t('reports.alert_profit_neg', 'Negative profit this period — check cost structure immediately') },
    todayAppts.length>0 && { type:'info', text: t('reports.alert_today_appts', '📅 Today has {count} appointments', { count: todayAppts.length }) },
  ].filter(Boolean);

  const revenueSparkline = trendData.slice(-7).map(d=>({v:d.revenue}));
  const bookingSparkline = bookingTrend.slice(-7).map(d=>({v:d.completed}));

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

      {/* SECTION 1: Executive KPI Cards */}
      <Section title={t('reports.sec_exec_kpis', 'Key Business KPIs')} sub="Real-time executive overview" icon={BarChart2} iconColor="text-blue-600">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          <ExecKPICard title={t('reports.kpi_total_revenue', 'Total Revenue')} value={shortVND(totalRevenue)} growth={18} sub={t('reports.sub_this_period', 'this period')} icon={TrendingUp} color="emerald" sparkData={revenueSparkline} onClick={()=>onDrillDown&&onDrillDown(t('reports.drill_invoices', 'Invoices'),invoices)} />
          <ExecKPICard title={t('reports.kpi_today_revenue', 'Today Revenue')} value={shortVND(todayRevenue)} growth={8} sub={t('reports.sub_vs_yesterday', 'vs yesterday')} icon={Zap} color="blue" sparkData={[]} onClick={()=>onDrillDown&&onDrillDown(t('reports.drill_today_invoices', 'Today Invoices'),todayInvoices)} />
          <ExecKPICard title={t('reports.kpi_est_profit', 'Estimated Profit')} value={shortVND(netProfit)} growth={netProfit>0?12:-8} sub={t('reports.sub_after_cost', 'after ~75% cost')} icon={Wallet} color={netProfit>=0?'emerald':'rose'} sparkData={[]} />
          <ExecKPICard title={t('reports.kpi_aov', 'AOV (Avg Order Value)')} value={shortVND(avgOrderValue)} growth={5} sub={t('reports.sub_per_invoice', 'per invoice')} icon={ShoppingBag} color="purple" sparkData={revenueSparkline} />
          <ExecKPICard title={t('reports.kpi_total_appointments', 'Total Appointments')} value={apptTotal} growth={bookingTrend.length>1?8:0} sub={t('reports.sub_this_period', 'this period')} icon={Calendar} color="amber" sparkData={bookingSparkline} onClick={()=>onDrillDown&&onDrillDown(t('reports.drill_appts', 'Appointments'),appointments)} />
          <ExecKPICard title={t('reports.kpi_fill_rate', 'Fill / Completion Rate')} value={`${fillRate}%`} growth={fillRate>70?5:-3} sub={t('reports.sub_completed_total', 'completed / total')} icon={Target} color="teal" sparkData={[]} />
          <ExecKPICard title={t('reports.kpi_cancellation_rate', 'Cancellation Rate')} value={`${cancelRate}%`} growth={-cancelRate} sub={t('reports.sub_target_under_10', 'target < 10%')} icon={XCircle} color={cancelRate>20?'rose':'emerald'} sparkData={[]} />
          <ExecKPICard title={t('reports.kpi_noshow_rate', 'No-Show Rate')} value={`${noShowRate}%`} growth={-noShowRate} sub={t('reports.sub_noshow', 'no show')} icon={AlertTriangle} color={noShowRate>15?'rose':'amber'} sparkData={[]} />
          <ExecKPICard title={t('reports.kpi_total_customers', 'Total Customers')} value={totalCustomers} growth={6} sub={`${newCustomers} ${t('reports.new', 'new')}`} icon={Users} color="blue" sparkData={[]} onClick={()=>onDrillDown&&onDrillDown(t('reports.drill_customers', 'Customers'),customers)} />
          <ExecKPICard title={t('reports.kpi_returning_customers', 'Returning Customers')} value={`${repeatRate}%`} growth={repeatRate>50?4:-2} sub={`${returnCustomers} ${t('reports.customers_unit', 'customers')}`} icon={CheckCircle} color="emerald" sparkData={[]} />
          <ExecKPICard title={t('reports.kpi_tips_received', 'Tips Received')} value={shortVND(totalTip)} growth={4} sub={t('reports.sub_from_customers', 'from customers')} icon={Gift} color="amber" sparkData={[]} />
          <ExecKPICard title={t('reports.kpi_inventory_value', 'Inventory Value')} value={shortVND(totalInventoryValue)} growth={0} sub={`${outOfStockProducts.length} ${t('reports.out_of_stock', 'out of stock')}`} icon={Layers} color={outOfStockProducts.length>0?'rose':'teal'} sparkData={[]} />
        </div>
      </Section>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Section title={t('reports.sec_alerts', 'Alerts & Actions Needed')} sub={t('reports.sub_active_alerts', '{count} active alerts', { count: alerts.length })} icon={AlertTriangle} iconColor="text-rose-500">
          <div className="grid sm:grid-cols-2 gap-2">
            {alerts.slice(0,6).map((a,i)=><AlertBadge key={i} type={a.type} text={a.text}/>)}
          </div>
        </Section>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Section title={t('reports.sec_ai_insights', 'AI Business Insights')} sub={t('reports.sub_ai_insights', 'Smart insights from business data')} icon={Star} iconColor="text-amber-500">
          <Card className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6">
              {aiInsights.slice(0,8).map((ins,i)=>(
                <p key={i} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">{ins}</p>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {/* SECTION 2: Revenue Trend */}
      <Section title={t('reports.sec_revenue_trend', 'Revenue Trend')} sub={t('reports.sub_vs_target', 'Comparison with target')} icon={TrendingUp} iconColor="text-emerald-600">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-slate-500">{t('reports.total_period', 'Total Period')}: </span>
              <span className="text-sm font-bold text-emerald-600">{formatVND(totalRevenue)}</span>
            </div>
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              {[
                ['7d', t('reports.preset_7d', '7 days')],
                ['14d', t('reports.preset_14d', '14 days')],
                ['30d', t('reports.preset_30d', '30 days')],
                ['90d', t('reports.preset_90d', '3 months')]
              ].map(([k,l])=>(
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
              <Area type="monotone" dataKey="revenue" name={t('reports.revenue_label', 'Revenue')} stroke={C.emerald} strokeWidth={2.5} fillOpacity={1} fill="url(#gRev2)"/>
              <Line type="monotone" dataKey="target" name={t('reports.target_label', 'Target')} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      {/* SECTION 3 + 4: Revenue Breakdown & Booking Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title={t('reports.sec_revenue_structure', 'Revenue Structure Breakdown')} sub={t('reports.sub_stacked_category', 'Stacked Bar by Category')} icon={DollarSign} iconColor="text-blue-600">
          <Card className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>shortVND(v)} tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} width={55}/>
                <Tooltip content={<VNDTooltip/>}/>
                <Legend wrapperStyle={{fontSize:10}} iconType="circle"/>
                <Bar dataKey={catServices} stackId="a" fill={C.blue}    radius={[0,0,0,0]}/>
                <Bar dataKey={catProducts} stackId="a" fill={C.emerald} radius={[0,0,0,0]}/>
                <Bar dataKey={catPackages} stackId="a" fill={C.purple}  radius={[0,0,0,0]}/>
                <Bar dataKey={catCombos}   stackId="a" fill={C.amber}   radius={[0,0,0,0]}/>
                <Bar dataKey={catCards}    stackId="a" fill={C.teal}    radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section title={t('reports.sec_booking_analysis', 'Appointment Analysis')} sub={t('reports.sub_status_over_time', 'By status over time')} icon={Calendar} iconColor="text-amber-500">
          <Card className="p-5">
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                {l: t('reports.status_pending', 'Pending'),      v:apptPending,    c:'text-amber-700 bg-amber-50'},
                {l: t('reports.status_confirmed', 'Confirmed'),  v:apptConfirmed,  c:'text-blue-700 bg-blue-50'},
                {l: t('reports.status_checked_in', 'Checked In'),v:apptCheckedIn,  c:'text-orange-700 bg-orange-50'},
                {l: t('reports.status_in_progress', 'In Progress'), v:apptInProgress, c:'text-purple-700 bg-purple-50'},
                {l: t('reports.status_completed', 'Completed'),  v:apptCompleted,  c:'text-emerald-700 bg-emerald-50'},
                {l: t('reports.status_cancelled', 'Cancelled'),  v:apptCancelled,  c:'text-rose-700 bg-rose-50'},
                {l: t('reports.status_no_show', 'No Show'),      v:apptNoShow,     c:'text-slate-700 bg-slate-100'},
                {l: t('reports.label_total', 'Total'),           v:apptTotal,      c:'text-slate-800 bg-slate-50 border border-slate-200'},
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
                <Area type="monotone" dataKey="completed" name={t('reports.status_completed', 'Completed')} stroke={C.emerald} fill={`${C.emerald}20`} strokeWidth={2}/>
                <Area type="monotone" dataKey="pending"   name={t('reports.status_pending', 'Pending')} stroke={C.amber}   fill={`${C.amber}15`}   strokeWidth={1.5}/>
                <Area type="monotone" dataKey="cancelled" name={t('reports.status_cancelled', 'Cancelled')} stroke={C.rose}    fill={`${C.rose}15`}    strokeWidth={1.5}/>
                <Area type="monotone" dataKey="noshow"    name={t('reports.status_no_show', 'No Show')} stroke={C.orange}  fill={`${C.orange}10`}  strokeWidth={1}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </div>

      {/* SECTION 5: Peak Hours Heatmap */}
      <Section title={t('reports.sec_peak_hours', 'Peak Hours Heatmap')} sub={t('reports.sub_peak_hours', 'Day × Hour — optimal staff scheduling')} icon={Clock} iconColor="text-indigo-600">
        <Card className="p-5 overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="grid gap-1" style={{gridTemplateColumns:`60px repeat(15,1fr)`}}>
              <div/>
              {VI_HOURS.map(h=><div key={h} className="text-center text-[9px] font-semibold text-slate-400">{h}</div>)}
            </div>
            {VI_DAYS.map((day,di)=>(
              <div key={day} className="grid gap-1 mt-1" style={{gridTemplateColumns:`60px repeat(15,1fr)`}}>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center">{day}</div>
                {heatmapData[di].map((val,hi)=>(
                  <HeatCell key={hi} value={val} max={heatMax}/>
                ))}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[9px] text-slate-400">{t('reports.low_density', 'Low')}</span>
              {[0.1,0.3,0.5,0.7,0.9].map(p=>(
                <div key={p} className="w-4 h-3 rounded-sm" style={{backgroundColor:`rgba(59,130,246,${p})`}}/>
              ))}
              <span className="text-[9px] text-slate-400">{t('reports.high_density', 'High')}</span>
            </div>
          </div>
        </Card>
      </Section>

      {/* SECTION 6 + 7: Top Employees + Top Services */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title={t('reports.sec_top_staff', 'Top Revenue Staff')} sub={t('reports.sub_rank_revenue', 'Ranked by revenue')} icon={Users} iconColor="text-blue-600">
          <Card className="p-5">
            {staffPerf.length===0
              ? <p className="text-xs text-slate-400 text-center py-10">{t('reports.no_data', 'No data available')}</p>
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={staffPerf} layout="vertical" barSize={16}>
                    <CartesianGrid horizontal={false} stroke="#f1f5f9"/>
                    <XAxis type="number" tickFormatter={v=>shortVND(v)} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} width={70}/>
                    <Tooltip content={<VNDTooltip/>}/>
                    <Bar dataKey="revenue" name={t('reports.revenue_label', 'Revenue')} radius={[0,6,6,0]} fill={C.blue}
                      onClick={row=>onDrillDown&&onDrillDown(`${t('reports.col_staff', 'Staff')}: ${row.fullName||row.name}`,invoices.filter(i=>(i.items||[]).some(it=>it.staff_id===staff.find(s=>s.full_name===row.fullName)?.id)))}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </Section>

        <Section title={t('reports.sec_top_services', 'Top Revenue Services')} sub={t('reports.sub_from_invoices', 'Based on invoice sales')} icon={Scissors} iconColor="text-purple-600">
          <Card className="p-5">
            {servicePerf.length===0
              ? <p className="text-xs text-slate-400 text-center py-10">{t('reports.no_data', 'No data available')}</p>
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={servicePerf} layout="vertical" barSize={16}>
                    <CartesianGrid horizontal={false} stroke="#f1f5f9"/>
                    <XAxis type="number" tickFormatter={v=>shortVND(v)} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} width={120}/>
                    <Tooltip content={<VNDTooltip/>}/>
                    <Bar dataKey="revenue" name={t('reports.revenue_label', 'Revenue')} radius={[0,6,6,0]} fill={C.purple}/>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </Section>
      </div>

      {/* SECTION 8 + 9: Customer Analysis + Payment Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Customer Donut */}
        <Section title={t('reports.sec_customer_analysis', 'Customer Analysis')} sub={t('reports.sub_cust_segments', 'Segmentation & value metrics')} icon={Users} iconColor="text-teal-600">
          <Card className="p-5 space-y-3">
            <div className="flex gap-4 items-center">
              <div className="shrink-0">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={custPieData.length?custPieData:[{name:t('reports.no_data', 'No data'),value:1}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={38}>
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
                  {l: t('reports.kpi_total_customers', 'Total Customers'),       v:totalCustomers, c:'text-slate-800'},
                  {l: t('reports.walk_in_customer', 'Walk-in Customer'), v:walkInCount,     c:'text-slate-500'},
                  {l: t('reports.new_customer', 'New Customer'),     v:newCustomers,   c:'text-blue-600'},
                  {l: t('reports.returning_customer', 'Returning Customer'),      v:returnCustomers,c:'text-emerald-600'},
                  {l: t('reports.vip_customer', 'VIP Customer (5M+)'),    v:vipCustomers,   c:'text-amber-600'},
                  {l: t('reports.repeat_rate', 'Return Rate'), v:`${repeatRate}%`,c:'text-purple-600'},
                  {l: t('reports.member_ltv', 'Member LTV'),v:shortVND(avgLTV),c:'text-slate-700'},
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
        <Section title={t('reports.sec_payment_analysis', 'Payment Analysis')} sub={t('reports.sub_payment_methods', 'Method breakdown')} icon={CreditCard} iconColor="text-sky-600">
          <Card className="p-5">
            {paymentData.length===0
              ? <p className="text-xs text-slate-400 text-center py-10">{t('reports.no_data', 'No data available')}</p>
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#64748B'}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={v=>shortVND(v)} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} width={52}/>
                    <Tooltip content={<VNDTooltip/>}/>
                    <Bar dataKey="value" name={t('reports.revenue_label', 'Revenue')} radius={[6,6,0,0]}>
                      {paymentData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </Section>
      </div>

      {/* SECTION 10: Cash Flow Waterfall */}
      <Section title={t('reports.sec_pnl', 'Cash Flow & Profit (P&L)')} sub={t('reports.sub_pnl_struct', 'Financial structure breakdown')} icon={Wallet} iconColor="text-emerald-600">
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

      {/* SECTION 11: Inventory Health */}
      <Section title={t('reports.sec_inventory_health', 'Inventory Health')} sub={`${products.length} ${t('reports.unit_products', 'products')} · ${outOfStockProducts.length} ${t('reports.out_of_stock', 'out of stock')} · ${lowStockProducts.length} ${t('reports.low_stock', 'low stock')}`} icon={Package} iconColor="text-orange-500">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Out/Low stock list */}
          <Card className="p-4 space-y-2">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">{t('reports.reorder_immediately', '⚠️ Reorder Needed Immediately')}</p>
            {outOfStockProducts.length===0&&lowStockProducts.length===0
              ? <p className="text-xs text-slate-400 text-center py-6">{t('reports.inventory_healthy', 'Inventory is healthy ✅')}</p>
              : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {[...outOfStockProducts.slice(0,5), ...lowStockProducts.slice(0,5)].map((p,i)=>(
                    <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${(p.stock_quantity||0)<=0?'bg-rose-50 text-rose-700':'bg-amber-50 text-amber-700'}`}>
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="font-bold shrink-0 ml-2">{(p.stock_quantity||0)<=0?t('reports.out_of_stock_label', 'Out of stock'):t('reports.in_stock_left', 'In stock: {count}', { count: p.stock_quantity })}</span>
                    </div>
                  ))}
                </div>
              )
            }
          </Card>

          {/* Inventory + Catalog stats */}
          <Card className="p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{t('reports.inv_catalog_summary', 'Inventory & Catalog Summary')}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {l: t('reports.total_products', 'Total Products'),     v:products.length,               c:'bg-blue-50 text-blue-700'},
                {l: t('reports.kpi_inventory_value', 'Inventory Value'),       v:shortVND(totalInventoryValue),  c:'bg-emerald-50 text-emerald-700'},
                {l: t('reports.low_stock_threshold', 'Low Stock (≤5)'),      v:lowStockProducts.length,        c:'bg-amber-50 text-amber-700'},
                {l: t('reports.out_of_stock_label', 'Out of Stock'),          v:outOfStockProducts.length,      c:'bg-rose-50 text-rose-600'},
              ].map(x=>(
                <div key={x.l} className={`rounded-xl p-2.5 text-center ${x.c}`}>
                  <div className="text-base font-extrabold">{x.v}</div>
                  <div className="text-[9px] font-semibold mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
            <div className="pt-1 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">{t('reports.active_catalog_cats', 'Active Catalog Categories')}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {l: t('reports.cat_services', 'Services'),      v:services.length,      c:'bg-blue-50 text-blue-700'},
                  {l: t('reports.cat_packages', 'Packages'),       v:packages.length,      c:'bg-purple-50 text-purple-700'},
                  {l: t('reports.cat_treatments', 'Treatments'),   v:treatments.length,    c:'bg-pink-50 text-pink-700'},
                  {l: t('reports.cat_service_combos', 'Svc Combos'),v:serviceCombos.length, c:'bg-amber-50 text-amber-700'},
                  {l: t('reports.cat_product_combos', 'Prod Combos'),v:productCombos.length, c:'bg-teal-50 text-teal-700'},
                  {l: t('reports.cat_prepaid_cards', 'Prepaid Cards'),v:prepaidCards.filter(c=>(c.balance||0)>0).length, c:'bg-indigo-50 text-indigo-700'},
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

      {/* SECTION 12: Upcoming Appointments */}
      <Section title={t('reports.sec_upcoming_today', 'Upcoming Appointments Today')} sub={t('reports.sub_upcoming_count', '{count} appointments from now onwards', { count: upcomingAppts.length })} icon={Clock} iconColor="text-blue-600">
        <Card className="p-4">
          {upcomingAppts.length===0
            ? <p className="text-xs text-slate-400 text-center py-8">{t('reports.no_upcoming_today', 'No remaining appointments today')}</p>
            : (
              <div className="space-y-2">
                {upcomingAppts.map((a,i)=>(
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 transition">
                    <div className="w-12 text-center shrink-0">
                      <div className="text-sm font-bold text-blue-600">{a.time||a.start_time||'--:--'}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{a.customer_name||t('reports.walk_in_customer', 'Walk-in Customer')}</div>
                      <div className="text-[10px] text-slate-400 truncate">{a.service_name||a.notes||t('reports.default_service_name', 'Service')}</div>
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
