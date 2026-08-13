'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Download, Printer, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from '@/lib/i18n';

const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayDate = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
function addMonths(d, n) { const x = new Date(d); x.setDate(1); x.setMonth(x.getMonth() + n); return x; }
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDOW(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function formatDisplay(d) { if (!d) return ''; return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; }
function isSameDay(a,b) { return a && b && a.toDateString() === b.toDateString(); }

const PRESETS = [
  { id:'today', key:'preset_today', defaultLabel:'Today' },
  { id:'yesterday', key:'preset_yesterday', defaultLabel:'Yesterday' },
  { id:'this_week', key:'preset_this_week', defaultLabel:'This Week' },
  { id:'last_week', key:'preset_last_week', defaultLabel:'Last Week' },
  { id:'this_month', key:'preset_this_month', defaultLabel:'This Month' },
  { id:'last_month', key:'preset_last_month', defaultLabel:'Last Month' },
  { id:'this_year', key:'preset_this_year', defaultLabel:'This Year' },
  { id:'last_year', key:'preset_last_year', defaultLabel:'Last Year' },
  { id:'all', key:'preset_all', defaultLabel:'All Time' },
];

function resolvePreset(id) {
  const t = todayDate(); const y = t.getFullYear(); const m = t.getMonth();
  const dow = (t.getDay()+6)%7;
  switch(id) {
    case 'today': return {start:t,end:t};
    case 'yesterday': {const d=new Date(t);d.setDate(d.getDate()-1);return{start:d,end:d};}
    case 'this_week': {const s=new Date(t);s.setDate(t.getDate()-dow);return{start:s,end:t};}
    case 'last_week': {
      const s=new Date(t);s.setDate(t.getDate()-dow-7);
      const e=new Date(t);e.setDate(t.getDate()-dow-1);
      return{start:s,end:e};
    }
    case 'this_month': return{start:new Date(y,m,1),end:t};
    case 'last_month': return{start:new Date(y,m-1,1),end:new Date(y,m,0)};
    case 'this_year': return{start:new Date(y,0,1),end:t};
    case 'last_year': return{start:new Date(y-1,0,1),end:new Date(y-1,11,31)};
    case 'all': return{start:new Date(2020,0,1),end:t};
    default: return null;
  }
}

function CalGrid({ year, month, startDay, endDay, hoverDay, onHover, onClick, selecting }) {
  const dim = getDaysInMonth(year, month);
  const fdow = getFirstDOW(year, month);
  const cells = [];
  for(let i=0;i<fdow;i++) cells.push(null);
  for(let d=1;d<=dim;d++) cells.push(new Date(year, month, d));
  const effectiveEnd = endDay || (selecting && hoverDay ? hoverDay : null);

  return (
    <div className="grid grid-cols-7 gap-y-0 sm:gap-y-0.5">
      {cells.map((d,i) => {
        if(!d) return <div key={`e${i}`}/>;
        const isS = isSameDay(d,startDay);
        const isE = isSameDay(d,endDay);
        const isTod = isSameDay(d,todayDate());
        const inR = (() => {
          if(!startDay||!effectiveEnd) return false;
          const lo=startDay<=effectiveEnd?startDay:effectiveEnd;
          const hi=startDay<=effectiveEnd?effectiveEnd:startDay;
          return d>lo&&d<hi;
        })();
        const showBarL = (isE || inR) && !(isS);
        const showBarR = (isS || inR) && !(isE);
        return (
          <div key={d.getDate()} className="relative flex justify-center items-center h-6 sm:h-8">
            {showBarL && <div className="absolute inset-y-0 sm:inset-y-1 left-0 right-1/2 bg-blue-50"/>}
            {showBarR && <div className="absolute inset-y-0 sm:inset-y-1 left-1/2 right-0 bg-blue-50"/>}
            <button
              onMouseEnter={()=>onHover(d)}
              onMouseLeave={()=>onHover(null)}
              onClick={()=>onClick(d)}
              className={`relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] font-medium transition cursor-pointer select-none
                ${isS||isE?'bg-blue-600 text-white font-bold':inR?'text-blue-800 hover:bg-blue-100':'text-slate-700 hover:bg-slate-100'}`}
            >
              {d.getDate()}
              {isTod&&!isS&&!isE&&<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"/>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DateRangePicker({ value, onChange }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('this_month');
  const [leftMonth, setLeftMonth] = useState(() => { const t=todayDate(); return new Date(t.getFullYear(),t.getMonth()-1,1); });
  const [startDay, setStartDay] = useState(null);
  const [endDay, setEndDay] = useState(null);
  const [hoverDay, setHoverDay] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const ref = useRef(null);
  const rightMonth = addMonths(leftMonth,1);

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const applyPreset = id => {
    const r = resolvePreset(id); if(!r) return;
    setActivePreset(id); setStartDay(r.start); setEndDay(r.end); setSelecting(false);
    setLeftMonth(new Date(r.start.getFullYear(),r.start.getMonth(),1));
  };

  const handleDayClick = d => {
    if(!selecting){setStartDay(d);setEndDay(null);setSelecting(true);setActivePreset(null);}
    else{
      if(d<startDay){setEndDay(startDay);setStartDay(d);}else{setEndDay(d);}
      setSelecting(false);
    }
  };

  const handleApply = () => {
    if(startDay&&endDay){onChange({startDate:toISO(startDay),endDate:toISO(endDay),preset:activePreset||'custom'});}
    setOpen(false);
  };

  const label = () => {
    const p=PRESETS.find(x=>x.id===activePreset);
    if(p&&!selecting) return t(`reports.${p.key}`, p.defaultLabel);
    if(startDay&&endDay) return `${formatDisplay(startDay)} – ${formatDisplay(endDay)}`;
    if(startDay) return `${formatDisplay(startDay)} – ...`;
    return t('reports.select_date_range', 'Select date range');
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(v=>!v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer">
        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0"/>
        <span className="max-w-[200px] truncate">{label()}</span>
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-[100] bg-slate-900/40 sm:hidden" onClick={()=>{setOpen(false);setSelecting(false);}} />

          <div className="fixed inset-4 sm:inset-auto sm:absolute sm:left-0 sm:top-full sm:mt-2 z-[100] sm:z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col sm:w-[740px] animate-in fade-in zoom-in-95 duration-100 max-h-full sm:max-h-none overflow-y-auto">
            <div className="flex flex-col sm:flex-row h-full">
              {/* Presets */}
              <div className="w-full sm:w-44 border-b sm:border-b-0 sm:border-r border-slate-100 py-2 flex flex-row sm:flex-col shrink-0 overflow-x-auto whitespace-nowrap">
                {PRESETS.map(p=>(
                  <button key={p.id} onClick={()=>applyPreset(p.id)}
                    className={`shrink-0 sm:w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-medium transition cursor-pointer
                      ${activePreset===p.id?'bg-blue-50 text-blue-700 font-semibold':'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    {t(`reports.${p.key}`, p.defaultLabel)}
                  </button>
                ))}
              </div>

              {/* Calendars + Footer */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-col sm:flex-row gap-2 p-3 sm:gap-4 sm:p-4">
                  {/* Left month */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <button onClick={()=>setLeftMonth(m=>addMonths(m,-1))} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                        <ChevronLeft className="w-4 h-4 text-slate-500"/>
                      </button>
                      <span className="text-sm font-bold text-slate-800">{MONTHS[leftMonth.getMonth()]} {leftMonth.getFullYear()}</span>
                      <div className="w-6"/>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {DAYS.map(d=><div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>)}
                    </div>
                    <CalGrid year={leftMonth.getFullYear()} month={leftMonth.getMonth()} startDay={startDay} endDay={endDay} hoverDay={hoverDay} onHover={setHoverDay} onClick={handleDayClick} selecting={selecting}/>
                  </div>

                  <div className="hidden sm:block w-px bg-slate-100 self-stretch"/>

                  {/* Right month */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-6"/>
                      <span className="text-sm font-bold text-slate-800">{MONTHS[rightMonth.getMonth()]} {rightMonth.getFullYear()}</span>
                      <button onClick={()=>setLeftMonth(m=>addMonths(m,1))} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                        <ChevronRight className="w-4 h-4 text-slate-500"/>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {DAYS.map(d=><div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>)}
                    </div>
                    <CalGrid year={rightMonth.getFullYear()} month={rightMonth.getMonth()} startDay={startDay} endDay={endDay} hoverDay={hoverDay} onHover={setHoverDay} onClick={handleDayClick} selecting={selecting}/>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-3 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <input readOnly value={startDay?formatDisplay(startDay):''} placeholder={t('reports.from_date', 'From date')}
                      className="w-28 flex-1 sm:flex-none px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-700 bg-slate-50 cursor-default outline-none"/>
                    <span className="text-slate-400 shrink-0">–</span>
                    <input readOnly value={endDay?formatDisplay(endDay):''} placeholder={t('reports.to_date', 'To date')}
                      className="w-28 flex-1 sm:flex-none px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-700 bg-slate-50 cursor-default outline-none"/>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto shrink-0 justify-end mt-1 sm:mt-0">
                    <button onClick={()=>{setOpen(false);setSelecting(false);}}
                      className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap text-center">
                      {t('reports.btn_cancel', 'Cancel')}
                    </button>
                    <button onClick={handleApply} disabled={!startDay||!endDay}
                      className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap text-center">
                      {t('reports.btn_apply', 'Apply')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FilterBar({ datePreset, setDatePreset, customRange, setCustomRange, searchQuery, setSearchQuery, onExportCSV, onExportPDF, extraFilters }) {
  const t = useT();
  const handleDateChange = ({ startDate, endDate, preset }) => {
    setCustomRange({ startDate, endDate });
    setDatePreset(preset || 'custom');
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <DateRangePicker value={customRange} onChange={handleDateChange}/>
        <div className="flex items-center gap-2">
          {setSearchQuery && (
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
              <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={t('reports.search_ph', 'Search...')}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white"/>
              {searchQuery&&<button onClick={()=>setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3"/></button>}
            </div>
          )}
          {onExportCSV&&(
            <button onClick={onExportCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition shadow-2xs cursor-pointer shrink-0">
              <Download className="w-3.5 h-3.5 text-emerald-600"/><span>{t('reports.btn_export_csv', 'Export CSV')}</span>
            </button>
          )}
          {onExportPDF&&(
            <button onClick={onExportPDF} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition shadow-2xs cursor-pointer shrink-0">
              <Printer className="w-3.5 h-3.5 text-blue-600"/><span>{t('reports.btn_export_pdf', 'Print PDF')}</span>
            </button>
          )}
        </div>
      </div>
      {extraFilters}
    </div>
  );
}
