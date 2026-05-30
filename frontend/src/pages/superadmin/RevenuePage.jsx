// src/pages/superadmin/RevenuePage.jsx
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import AdminLayout from '../admin/AdminLayout';
import { superadminAPI } from '../../api/index.js';
import s from './RevenuePage.module.css';

const MONTHS_FULL = ['','जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून',
  'जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
const MONTHS_SHORT = ['','जाने','फेब्रु','मार्च','एप्रिल','मे','जून',
  'जुलै','ऑगस्ट','सप्टें','ऑक्टो','नोव्हें','डिसें'];

const fmt  = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtK = (n) => {
  const v = Number(n||0);
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v}`;
};

const COLORS = { online: '#1565c0', cash: '#e65100', commission: '#6a1b9a', total: '#2e7d32' };
const PIE_COLORS = ['#1565c0', '#e65100', '#43a047', '#8e24aa'];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={s.tooltip}>
      <p className={s.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '3px 0', fontSize: 13 }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

function KpiCard({ icon, label, value, sub, gradient, trend }) {
  return (
    <div className={s.kpiCard} style={{ background: gradient }}>
      <div className={s.kpiTop}>
        <span className={s.kpiIcon}>{icon}</span>
        {trend !== undefined && (
          <span className={`${s.trendBadge} ${trend >= 0 ? s.trendUp : s.trendDown}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={s.kpiValue}>{value}</div>
      <div className={s.kpiLabel}>{label}</div>
      {sub && <div className={s.kpiSub}>{sub}</div>}
    </div>
  );
}

export default function RevenuePage() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [year,     setYear]     = useState(new Date().getFullYear().toString());
  const [month,    setMonth]    = useState('');
  const [tenantId, setTenantId] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (year)     params.year      = year;
    if (month)    params.month     = month;
    if (tenantId) params.tenant_id = tenantId;
    superadminAPI.getRevenue(params)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [year, month, tenantId]);

  const sm = data?.summary || {};
  const totalCollected = Number(sm.online_collected||0) + Number(sm.cash_collected||0);

  // Prepare chart data — reverse so oldest first
  const areaData = [...(data?.monthly || [])].reverse().map(m => ({
    name:       MONTHS_SHORT[m.month_num] + ' ' + String(m.year).slice(2),
    Online:     Number(m.online_revenue  || 0),
    'रोख':     Number(m.cash_revenue    || 0),
    Commission: Number(m.platform_fee   || 0),
    Bookings:   Number(m.total_bookings || 0),
  }));

  const barData = (data?.byTenant || []).map(t => ({
    name:   t.name.length > 12 ? t.name.slice(0,12)+'…' : t.name,
    Online: Number(t.online_revenue     || 0),
    'रोख': Number(t.cash_revenue       || 0),
    Comm:   Number(t.platform_commission|| 0),
  }));

  const pieData = [
    { name: 'Online',     value: Number(sm.online_collected || 0) },
    { name: 'रोख',       value: Number(sm.cash_collected   || 0) },
  ].filter(d => d.value > 0);

  // Trend: compare last 2 months
  const m0 = data?.monthly?.[0], m1 = data?.monthly?.[1];
  const currTotal = m0 ? Number(m0.online_revenue||0) + Number(m0.cash_revenue||0) : 0;
  const prevTotal = m1 ? Number(m1.online_revenue||0) + Number(m1.cash_revenue||0) : 0;
  const trendPct  = prevTotal ? +((currTotal - prevTotal) / prevTotal * 100).toFixed(1) : undefined;

  return (
    <AdminLayout>
      <div className={s.page}>

        {/* Header */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>📊 Revenue Dashboard</h1>
            <p className={s.subtitle}>Platform च्या सर्व उत्पन्नाचा तपशील</p>
          </div>
          <div className={s.filterRow}>
            <select className={s.select} value={year}
              onChange={e => { setYear(e.target.value); setMonth(''); }}>
              <option value="">सर्व वर्षे</option>
              {data?.years?.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className={s.select} value={month}
              onChange={e => setMonth(e.target.value)} disabled={!year}>
              <option value="">सर्व महिने</option>
              {MONTHS_FULL.slice(1).map((m,i) =>
                <option key={i+1} value={i+1}>{m}</option>
              )}
            </select>
            <select className={s.select} value={tenantId}
              onChange={e => setTenantId(e.target.value)}>
              <option value="">सर्व Tenants</option>
              {data?.byTenant?.map(t =>
                <option key={t.id} value={t.id}>{t.name}</option>
              )}
            </select>
            {(month || tenantId || year !== new Date().getFullYear().toString()) && (
              <button className={s.clearBtn} onClick={() => {
                setYear(new Date().getFullYear().toString());
                setMonth(''); setTenantId('');
              }}>✕ Reset</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner"/></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className={s.kpiGrid}>
              <KpiCard icon="💰" label="एकूण जमा"
                value={fmtK(totalCollected)}
                sub={`${sm.paid_bookings||0} paid bookings`}
                gradient="linear-gradient(135deg,#2e7d32,#43a047)"
                trend={trendPct}
              />
              <KpiCard icon="💳" label="Online जमा"
                value={fmtK(sm.online_collected)}
                sub={`${sm.online_bookings||0} bookings`}
                gradient="linear-gradient(135deg,#1565c0,#1e88e5)"
              />
              <KpiCard icon="💵" label="रोख जमा"
                value={fmtK(sm.cash_collected)}
                sub={`${sm.cash_bookings||0} bookings`}
                gradient="linear-gradient(135deg,#e65100,#f57c00)"
              />
              <KpiCard icon="🏦" label="Commission"
                value={fmtK(sm.platform_commission)}
                sub={totalCollected
                  ? `${((sm.platform_commission/totalCollected)*100).toFixed(1)}% of collected`
                  : '0%'}
                gradient="linear-gradient(135deg,#6a1b9a,#8e24aa)"
              />
              <KpiCard icon="📋" label="एकूण Bookings"
                value={sm.total_bookings||0}
                sub={`${sm.unpaid_bookings||0} unpaid बाकी`}
                gradient="linear-gradient(135deg,#37474f,#546e7a)"
              />
              <KpiCard icon="✅" label="Success Rate"
                value={`${sm.total_bookings
                  ? Math.round((sm.paid_bookings/sm.total_bookings)*100) : 0}%`}
                sub={`${sm.paid_bookings||0} paid of ${sm.total_bookings||0}`}
                gradient="linear-gradient(135deg,#f57f17,#fbc02d)"
              />
            </div>

            {/* Charts Row */}
            <div className={s.chartsRow}>
              {/* Area Chart */}
              <div className={s.chartCard}>
                <h3 className={s.chartTitle}>📈 Monthly Revenue Trend</h3>
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={areaData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gOnline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={COLORS.online} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={COLORS.online} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={COLORS.cash} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={COLORS.cash} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8"/>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }}/>
                      <YAxis tickFormatter={v => fmtK(v)} tick={{ fontSize: 11, fill: '#888' }} width={55}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }}/>
                      <Area type="monotone" dataKey="Online" stroke={COLORS.online}
                        strokeWidth={2.5} fill="url(#gOnline)" dot={{ r:3 }} activeDot={{ r:5 }}/>
                      <Area type="monotone" dataKey="रोख" stroke={COLORS.cash}
                        strokeWidth={2.5} fill="url(#gCash)" dot={{ r:3 }} activeDot={{ r:5 }}/>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className={s.noData}>data उपलब्ध नाही</p>}
              </div>

              {/* Pie Chart */}
              <div className={s.chartCard}>
                <h3 className={s.chartTitle}>🍩 Payment Split</h3>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%"
                          innerRadius={45} outerRadius={70}
                          paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) =>
                            <Cell key={i} fill={PIE_COLORS[i]}/>
                          )}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={s.pieLabels}>
                      {pieData.map((d, i) => (
                        <div key={i} className={s.pieLabel}>
                          <span className={s.pieDot} style={{ background: PIE_COLORS[i] }}/>
                          <span>{d.name}</span>
                          <strong>{fmtK(d.value)}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className={s.noData}>data उपलब्ध नाही</p>}

                <div className={s.splitStats}>
                  <div className={s.splitRow}>
                    <span>Collection Rate</span>
                    <strong style={{color:'#2e7d32'}}>
                      {sm.gross_revenue
                        ? Math.round((totalCollected/sm.gross_revenue)*100) : 0}%
                    </strong>
                  </div>
                  <div className={s.splitRow}>
                    <span>Avg per Booking</span>
                    <strong>
                      {sm.paid_bookings ? fmtK(totalCollected/sm.paid_bookings) : '₹0'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Bar Chart */}
            {barData.length > 1 && (
              <div className={s.chartCard} style={{ marginBottom: 20 }}>
                <h3 className={s.chartTitle}>🏢 Tenant नुसार Revenue तुलना</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top:10,right:20,left:10,bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8"/>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }}/>
                    <YAxis tickFormatter={v => fmtK(v)} tick={{ fontSize:11, fill:'#888' }} width={55}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }}/>
                    <Bar dataKey="Online" fill={COLORS.online} radius={[4,4,0,0]}/>
                    <Bar dataKey="रोख"   fill={COLORS.cash}   radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Monthly Table */}
            <div className={s.tableCard}>
              <h3 className={s.chartTitle}>📅 महिनानुसार तपशील</h3>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>महिना</th>
                      <th>Bookings</th>
                      <th>Paid</th>
                      <th>💳 Online</th>
                      <th>💵 रोख</th>
                      <th>एकूण जमा</th>
                      <th>Commission</th>
                      <th>% Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.monthly?.map((m, i) => {
                      const total   = Number(m.online_revenue||0) + Number(m.cash_revenue||0);
                      const maxT    = Math.max(...data.monthly.map(x =>
                        Number(x.online_revenue||0)+Number(x.cash_revenue||0)), 1);
                      const pct     = Math.round((total/maxT)*100);
                      return (
                        <tr key={i} className={i===0 ? s.currentRow : ''}>
                          <td>
                            <span className={s.monthName}>{MONTHS_FULL[m.month_num]}</span>
                            <span className={s.yearTag}>{m.year}</span>
                            {i===0 && <span className={s.liveTag}>● Live</span>}
                          </td>
                          <td>{m.total_bookings}</td>
                          <td><span className={s.paidBadge}>{m.paid_bookings}</span></td>
                          <td className={s.onlineAmt}>{fmt(m.online_revenue)}</td>
                          <td className={s.cashAmt}>{fmt(m.cash_revenue)}</td>
                          <td className={s.totalAmt}>{fmt(total)}</td>
                          <td className={s.commAmt}>{fmt(m.platform_fee)}</td>
                          <td>
                            <div className={s.miniBar}>
                              <div className={s.miniBarFill} style={{ width:`${pct}%` }}/>
                              <span>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!data?.monthly?.length && (
                      <tr><td colSpan={8} className={s.empty}>
                        या कालावधीत कोणताही data नाही.
                      </td></tr>
                    )}
                  </tbody>
                  {data?.monthly?.length > 0 && (
                    <tfoot>
                      <tr>
                        <td><strong>एकूण</strong></td>
                        <td><strong>{data.monthly.reduce((a,m)=>a+Number(m.total_bookings),0)}</strong></td>
                        <td><strong>{data.monthly.reduce((a,m)=>a+Number(m.paid_bookings),0)}</strong></td>
                        <td className={s.onlineAmt}><strong>{fmt(data.monthly.reduce((a,m)=>a+Number(m.online_revenue||0),0))}</strong></td>
                        <td className={s.cashAmt}><strong>{fmt(data.monthly.reduce((a,m)=>a+Number(m.cash_revenue||0),0))}</strong></td>
                        <td className={s.totalAmt}><strong>{fmt(data.monthly.reduce((a,m)=>a+Number(m.online_revenue||0)+Number(m.cash_revenue||0),0))}</strong></td>
                        <td className={s.commAmt}><strong>{fmt(data.monthly.reduce((a,m)=>a+Number(m.platform_fee||0),0))}</strong></td>
                        <td/>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Tenant Table */}
            <div className={s.tableCard}>
              <h3 className={s.chartTitle}>🏢 Tenant नुसार Revenue</h3>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Rank</th><th>Tenant</th><th>Plan</th>
                      <th>Bookings</th><th>💳 Online</th><th>💵 रोख</th>
                      <th>एकूण जमा</th><th>Commission</th><th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.byTenant?.map((t, i) => {
                      const total  = Number(t.online_revenue||0) + Number(t.cash_revenue||0);
                      const share  = totalCollected ? Math.round((total/totalCollected)*100) : 0;
                      const pc     = {premium:'#2e7d32',basic:'#1565c0',trial:'#e65100'}[t.plan]||'#555';
                      return (
                        <tr key={t.id}>
                          <td className={s.rank}>{['🥇','🥈','🥉'][i] || i+1}</td>
                          <td><strong>{t.name}</strong></td>
                          <td><span className={s.planBadge} style={{background:pc}}>{t.plan?.toUpperCase()}</span></td>
                          <td>
                            {t.total_bookings}
                            {t.paid_bookings>0 &&
                              <span className={s.paidSub}>{t.paid_bookings} paid</span>}
                          </td>
                          <td className={s.onlineAmt}>{fmt(t.online_revenue)}</td>
                          <td className={s.cashAmt}>{fmt(t.cash_revenue)}</td>
                          <td className={s.totalAmt}>{fmt(total)}</td>
                          <td className={s.commAmt}>{fmt(t.platform_commission)}</td>
                          <td>
                            <div className={s.miniBar}>
                              <div className={s.miniBarFill} style={{width:`${share}%`,background:'linear-gradient(90deg,#2e7d32,#43a047)'}}/>
                              <span>{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
