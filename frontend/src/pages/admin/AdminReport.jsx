// src/pages/admin/AdminReport.jsx — Admin Revenue & Booking Report
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import AdminLayout from './AdminLayout';
import { adminAPI } from '../../api/index.js';
import s from './AdminReport.module.css';

const MONTHS_FULL  = ['','जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
const MONTHS_SHORT = ['','जाने','फेब्रु','मार्च','एप्रिल','मे','जून','जुलै','ऑग','सप्टें','ऑक्टो','नोव्हें','डिसें'];

const fmt  = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v}`;
};

const STATUS_LABELS = {
  pending: 'प्रतीक्षेत', confirmed: 'पुष्टी', completed: 'पूर्ण',
  cancelled: 'रद्द', in_progress: 'सुरू आहे',
};
const STATUS_COLORS = {
  completed: '#2e7d32', confirmed: '#1565c0', pending: '#f57f17',
  cancelled: '#c62828', in_progress: '#6a1b9a',
};

const PIE_COLORS   = ['#1565c0', '#e65100', '#43a047', '#8e24aa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={s.tooltip}>
      <p className={s.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin:'3px 0', fontSize:13 }}>
          {p.name}: <strong>{p.name === 'Bookings' ? p.value : fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

function KpiCard({ icon, label, value, sub, color, trend }) {
  return (
    <div className={s.kpi} style={{ borderTopColor: color }}>
      <div className={s.kpiRow}>
        <span className={s.kpiIcon}>{icon}</span>
        {trend !== undefined && (
          <span className={`${s.trend} ${trend >= 0 ? s.trendUp : s.trendDown}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={s.kpiVal}>{value}</div>
      <div className={s.kpiLabel}>{label}</div>
      {sub && <div className={s.kpiSub}>{sub}</div>}
    </div>
  );
}

export default function AdminReport() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [year,    setYear]    = useState(new Date().getFullYear().toString());
  const [month,   setMonth]   = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (year)  params.year  = year;
    if (month) params.month = month;
    adminAPI.getReport(params)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [year, month]);

  const kpi      = data?.kpi      || {};
  const monthly  = data?.monthly  || [];
  const topP     = data?.topPujaris || [];
  const topPoojas= data?.topPoojas  || [];
  const statusBD = data?.statusBreakdown || [];
  const counts   = data?.counts   || {};

  const totalRevenue = Number(kpi.online_revenue||0) + Number(kpi.cash_revenue||0);

  // Monthly chart data — oldest first
  const areaData = [...monthly].reverse().map(m => ({
    name:     MONTHS_SHORT[m.mo] + ' ' + String(m.yr).slice(2),
    Online:   Number(m.online_revenue  || 0),
    'रोख':   Number(m.cash_revenue    || 0),
    Bookings: Number(m.total_bookings  || 0),
  }));

  // Pie — payment split
  const pieData = [
    { name: 'Online', value: Number(kpi.online_revenue || 0) },
    { name: 'रोख',    value: Number(kpi.cash_revenue   || 0) },
  ].filter(d => d.value > 0);

  // Booking status pie
  const statusPie = statusBD.map(s => ({
    name:  STATUS_LABELS[s.status] || s.status,
    value: Number(s.cnt),
    color: STATUS_COLORS[s.status] || '#888',
  }));

  // Trend — compare latest 2 months
  const m0 = monthly[0], m1 = monthly[1];
  const curr = m0 ? Number(m0.online_revenue||0) + Number(m0.cash_revenue||0) : 0;
  const prev = m1 ? Number(m1.online_revenue||0) + Number(m1.cash_revenue||0) : 0;
  const trendPct = prev ? +((curr - prev) / prev * 100).toFixed(1) : undefined;

  return (
    <AdminLayout>
      <div className={s.page}>

        {/* ── Header ────────────────────────────────────────── */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>📊 Revenue Report</h1>
            <p className={s.subtitle}>बुकिंग, उत्पन्न आणि पुजारी कामगिरीचा संपूर्ण तपशील</p>
          </div>
          <div className={s.filters}>
            <input type="date" className={s.sel} value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              title="तारखेपासून" style={{ padding: '6px 8px' }} />
            <input type="date" className={s.sel} value={toDate}
              onChange={e => setToDate(e.target.value)}
              title="तारखेपर्यंत" style={{ padding: '6px 8px' }} />
            <select className={s.sel} value={year}
              onChange={e => { setYear(e.target.value); setMonth(''); }}>
              <option value="">सर्व वर्षे</option>
              {(data?.years || [new Date().getFullYear()]).map(y =>
                <option key={y} value={y}>{y}</option>
              )}
            </select>
            <select className={s.sel} value={month}
              onChange={e => setMonth(e.target.value)} disabled={!year}>
              <option value="">सर्व महिने</option>
              {MONTHS_FULL.slice(1).map((m, i) =>
                <option key={i+1} value={i+1}>{m}</option>
              )}
            </select>
            {(month || year !== new Date().getFullYear().toString()) && (
              <button className={s.resetBtn} onClick={() => {
                setYear(new Date().getFullYear().toString()); setMonth('');
                setFromDate(''); setToDate('');
              }}>✕ Reset</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner"/></div>
        ) : (
          <>
            {/* ── KPI Cards ─────────────────────────────────── */}
            <div className={s.kpiGrid}>
              <KpiCard icon="💰" label="एकूण उत्पन्न"
                value={fmtK(totalRevenue)}
                sub={`${kpi.paid_bookings||0} paid बुकिंग`}
                color="#2e7d32" trend={trendPct}
              />
              <KpiCard icon="💳" label="Online उत्पन्न"
                value={fmtK(kpi.online_revenue)}
                sub={`${kpi.online_bookings||0} बुकिंग`}
                color="#1565c0"
              />
              <KpiCard icon="💵" label="रोख उत्पन्न"
                value={fmtK(kpi.cash_revenue)}
                sub={`${kpi.cash_bookings||0} बुकिंग`}
                color="#e65100"
              />
              <KpiCard icon="📋" label="एकूण बुकिंग"
                value={kpi.total_bookings||0}
                sub={`${kpi.completed_bookings||0} पूर्ण • ${kpi.cancelled_bookings||0} रद्द`}
                color="#37474f"
              />
              <KpiCard icon="✅" label="यश दर"
                value={`${kpi.total_bookings
                  ? Math.round((kpi.paid_bookings/kpi.total_bookings)*100) : 0}%`}
                sub={`${kpi.unpaid_bookings||0} unpaid बाकी`}
                color="#f57f17"
              />
              <KpiCard icon="🧑‍🦳" label="मंजूर पुजारी"
                value={counts.pujaris||0}
                sub={`${counts.pending||0} pending अर्ज`}
                color="#6a1b9a"
              />
              <KpiCard icon="👥" label="नोंदणीकृत वापरकर्ते"
                value={counts.users||0}
                sub="एकूण registered"
                color="#00838f"
              />
              <KpiCard icon="⭐" label="Avg प्रति बुकिंग"
                value={kpi.paid_bookings ? fmtK(totalRevenue / kpi.paid_bookings) : '₹0'}
                sub="paid bookings average"
                color="#c0392b"
              />
            </div>

            {/* ── Charts Row ────────────────────────────────── */}
            <div className={s.chartsRow}>
              {/* Area — monthly trend */}
              <div className={s.chartCard}>
                <h3 className={s.chartTitle}>📈 महिनानुसार उत्पन्न</h3>
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={areaData} margin={{ top:10,right:20,left:5,bottom:0 }}>
                      <defs>
                        <linearGradient id="gOnl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#1565c0" stopOpacity={0.28}/>
                          <stop offset="95%" stopColor="#1565c0" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gCsh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#e65100" stopOpacity={0.28}/>
                          <stop offset="95%" stopColor="#e65100" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8"/>
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:'#888' }}/>
                      <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} width={52}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }}/>
                      <Area type="monotone" dataKey="Online" stroke="#1565c0"
                        strokeWidth={2.5} fill="url(#gOnl)" dot={{ r:3 }} activeDot={{ r:5 }}/>
                      <Area type="monotone" dataKey="रोख" stroke="#e65100"
                        strokeWidth={2.5} fill="url(#gCsh)" dot={{ r:3 }} activeDot={{ r:5 }}/>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className={s.noData}>data उपलब्ध नाही</p>}
              </div>

              {/* Pie — payment split */}
              <div className={s.chartCard}>
                <h3 className={s.chartTitle}>🍩 Payment प्रकार</h3>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%"
                          innerRadius={48} outerRadius={72}
                          paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) =>
                            <Cell key={i} fill={PIE_COLORS[i]}/>
                          )}
                        </Pie>
                        <Tooltip formatter={fmt}/>
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
                    <strong style={{ color:'#2e7d32' }}>
                      {kpi.gross_revenue
                        ? Math.round((totalRevenue / kpi.gross_revenue)*100) : 0}%
                    </strong>
                  </div>
                  <div className={s.splitRow}>
                    <span>Avg per Booking</span>
                    <strong>{kpi.paid_bookings ? fmtK(totalRevenue/kpi.paid_bookings) : '₹0'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Status + Top Poojas row ───────────────────── */}
            <div className={s.chartsRow}>
              {/* Booking status */}
              <div className={s.chartCard}>
                <h3 className={s.chartTitle}>📊 बुकिंग स्थिती</h3>
                {statusPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={statusPie} margin={{ top:10,right:20,left:5,bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8"/>
                      <XAxis dataKey="name" tick={{ fontSize:12, fill:'#555' }}/>
                      <YAxis tick={{ fontSize:11, fill:'#888' }}/>
                      <Tooltip/>
                      <Bar dataKey="value" name="बुकिंग" radius={[6,6,0,0]}>
                        {statusPie.map((s, i) =>
                          <Cell key={i} fill={s.color}/>
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className={s.noData}>data उपलब्ध नाही</p>}
              </div>

              {/* Top Poojas */}
              <div className={s.chartCard}>
                <h3 className={s.chartTitle}>🪔 Top 5 पूजा</h3>
                <div className={s.topList}>
                  {topPoojas.length === 0
                    ? <p className={s.noData}>data उपलब्ध नाही</p>
                    : topPoojas.map((p, i) => {
                      const maxCnt = topPoojas[0].cnt || 1;
                      return (
                        <div key={i} className={s.topItem}>
                          <span className={s.topRank}>{['🥇','🥈','🥉','④','⑤'][i]}</span>
                          <div className={s.topInfo}>
                            <div className={s.topName}>{p.name_mr}</div>
                            <div className={s.topBar}>
                              <div className={s.topBarFill}
                                style={{ width:`${Math.round((p.cnt/maxCnt)*100)}%` }}/>
                            </div>
                          </div>
                          <div className={s.topStats}>
                            <span className={s.topCnt}>{p.cnt} बुकिंग</span>
                            <span className={s.topRev}>{fmtK(p.revenue)}</span>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>

            {/* ── Monthly Table ─────────────────────────────── */}
            <div className={s.tableCard}>
              <h3 className={s.chartTitle}>📅 महिनानुसार तपशील</h3>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>महिना</th>
                      <th>एकूण बुकिंग</th>
                      <th>Paid</th>
                      <th>💳 Online</th>
                      <th>💵 रोख</th>
                      <th>एकूण उत्पन्न</th>
                      <th>% Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m, i) => {
                      const total = Number(m.online_revenue||0) + Number(m.cash_revenue||0);
                      const maxT  = Math.max(...monthly.map(x =>
                        Number(x.online_revenue||0)+Number(x.cash_revenue||0)), 1);
                      const pct   = Math.round((total/maxT)*100);
                      return (
                        <tr key={i} className={i===0 ? s.currentRow : ''}>
                          <td>
                            <span className={s.monthName}>{MONTHS_FULL[m.mo]}</span>
                            <span className={s.yearTag}>{m.yr}</span>
                            {i===0 && <span className={s.liveTag}>● Live</span>}
                          </td>
                          <td className={s.center}>{m.total_bookings}</td>
                          <td className={s.center}>
                            <span className={s.paidBadge}>{m.paid_bookings}</span>
                          </td>
                          <td className={s.onlineAmt}>{fmt(m.online_revenue)}</td>
                          <td className={s.cashAmt}>{fmt(m.cash_revenue)}</td>
                          <td className={s.totalAmt}><strong>{fmt(total)}</strong></td>
                          <td>
                            <div className={s.miniBar}>
                              <div className={s.miniBarFill} style={{ width:`${pct}%` }}/>
                              <span className={s.miniBarPct}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {monthly.length === 0 && (
                      <tr><td colSpan={7} className={s.emptyRow}>
                        या कालावधीत कोणताही data नाही.
                      </td></tr>
                    )}
                  </tbody>
                  {monthly.length > 0 && (
                    <tfoot>
                      <tr>
                        <td><strong>एकूण</strong></td>
                        <td className={s.center}><strong>{monthly.reduce((a,m)=>a+Number(m.total_bookings),0)}</strong></td>
                        <td className={s.center}><strong>{monthly.reduce((a,m)=>a+Number(m.paid_bookings),0)}</strong></td>
                        <td className={s.onlineAmt}><strong>{fmt(monthly.reduce((a,m)=>a+Number(m.online_revenue||0),0))}</strong></td>
                        <td className={s.cashAmt}><strong>{fmt(monthly.reduce((a,m)=>a+Number(m.cash_revenue||0),0))}</strong></td>
                        <td className={s.totalAmt}><strong>{fmt(monthly.reduce((a,m)=>a+Number(m.online_revenue||0)+Number(m.cash_revenue||0),0))}</strong></td>
                        <td/>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ── Top Pujaris Table ─────────────────────────── */}
            <div className={s.tableCard}>
              <h3 className={s.chartTitle}>🏆 Top पुजारी — कामगिरी</h3>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Rank</th><th>पुजारी</th><th>शहर</th>
                      <th>⭐ Rating</th><th>📋 बुकिंग</th><th>💰 उत्पन्न</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topP.length === 0
                      ? <tr><td colSpan={6} className={s.emptyRow}>data नाही</td></tr>
                      : topP.map((p, i) => (
                        <tr key={p.id}>
                          <td className={s.rank}>{['🥇','🥈','🥉'][i] || <span className={s.rankNum}>{i+1}</span>}</td>
                          <td><strong>{p.full_name}</strong></td>
                          <td>{p.city || '—'}</td>
                          <td>
                            <span style={{ color:'#f57f17', fontWeight:700 }}>
                              ★ {Number(p.avg_rating||0).toFixed(1)}
                            </span>
                            <span style={{ fontSize:12, color:'#999', marginLeft:4 }}>
                              ({p.total_reviews||0})
                            </span>
                          </td>
                          <td className={s.center}>
                            <span className={s.paidBadge}>{p.booking_count}</span>
                          </td>
                          <td className={s.totalAmt}>{fmtK(p.revenue)}</td>
                        </tr>
                      ))
                    }
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
