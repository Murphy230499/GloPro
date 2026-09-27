with open('src/components/staff/SchedulerGrid.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# srcStaffId
content = content.replace(
    '''<select value={srcStaffId} onChange={(e) => { setSrcStaffId(e.target.value); setDestStaffIds([]); }} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">''',
    '''<select value={srcStaffId} onChange={(e) => { setSrcStaffId(e.target.value); setDestStaffIds([]); }} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-400 transition-colors ${!srcStaffId ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>'''
)

# srcDay
content = content.replace(
    '''<select value={srcDay} onChange={(e) => { setSrcDay(e.target.value); setDestDays([]); }} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">''',
    '''<select value={srcDay} onChange={(e) => { setSrcDay(e.target.value); setDestDays([]); }} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-400 transition-colors ${!srcDay ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>'''
)

# swapDay
content = content.replace(
    '''<select value={swapDay} onChange={(e) => setSwapDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">''',
    '''<select value={swapDay} onChange={(e) => setSwapDay(e.target.value)} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-400 transition-colors ${!swapDay ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>'''
)

# swapStaffA
content = content.replace(
    '''<select value={swapStaffA} onChange={(e) => setSwapStaffA(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">''',
    '''<select value={swapStaffA} onChange={(e) => setSwapStaffA(e.target.value)} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-400 transition-colors ${!swapStaffA ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>'''
)

# swapStaffB
content = content.replace(
    '''<select value={swapStaffB} onChange={(e) => setSwapStaffB(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">''',
    '''<select value={swapStaffB} onChange={(e) => setSwapStaffB(e.target.value)} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-400 transition-colors ${!swapStaffB ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>'''
)

with open('src/components/staff/SchedulerGrid.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Selects styled!")
