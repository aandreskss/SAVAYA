'use client'

import { useId, useState } from 'react'
import { changeLabel, SUMMARY_LABELS, type GoogleReport, type ReportTable } from './google-report-model'

const number = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 1 })
const money = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' })
const date = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const card = 'rounded-2xl border border-border bg-surface shadow-sm'
const eventNames: Record<string, string> = { page_view: 'Visitas a páginas', view_item: 'Productos vistos', add_to_cart: 'Añadidos al carrito', begin_checkout: 'Checkout iniciado', purchase: 'Compras' }

export function dailySeries(report: GoogleReport, column: number) {
  const rows = report.tables.find(table => table.title === 'Evolución diaria')?.rows ?? []
  const values = new Map(rows.map(row => [row[0], Number(row[column]) || 0]))
  const series: { day: string; value: number }[] = []
  for (let time = Date.parse(report.range.from); time <= Date.parse(report.range.to); time += 86_400_000) {
    const day = new Date(time).toISOString().slice(0, 10)
    series.push({ day, value: values.get(day) ?? 0 })
  }
  return series
}

function DataTable({ table }: { table: ReportTable }) {
  return <div className={`${card} overflow-hidden min-w-0`}>
    <div className="flex items-center justify-between gap-3 p-5 border-b border-border"><h3 className="text-sm font-semibold">{table.title}</h3><span className="text-[11px] text-text-secondary whitespace-nowrap">{table.rows.length} filas</span></div>
    {!table.rows.length ? <div className="p-10 text-center text-sm text-text-secondary">No hay actividad registrada en este período.</div> :
      <div className="overflow-auto max-h-96" tabIndex={0} role="region" aria-label={table.title}>
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 bg-surface-2"><tr>{table.headers.map((header, index) => <th key={header} scope="col" className={`px-4 py-3 font-medium text-text-secondary whitespace-nowrap ${index ? 'text-right' : ''}`}>{header}</th>)}</tr></thead>
          <tbody>{table.rows.map((row, index) => <tr key={index} className="border-t border-border/60 hover:bg-surface-2/40 transition-colors">
            {row.map((value, column) => <td key={column} className={`px-4 py-3 max-w-64 ${column ? 'text-right tabular-nums' : 'font-medium break-words'}`}>
              {typeof value === 'number' ? (table.headers[column]?.includes('USD') ? money.format(value) : number.format(value)) : (eventNames[value] ?? value)}
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>}
  </div>
}

export function GoogleAnalyticsDashboard({ report }: { report: GoogleReport }) {
  const [metric, setMetric] = useState(1)
  const [section, setSection] = useState('audience')
  const gradientId = useId().replace(/:/g, '')
  const series = dailySeries(report, metric + 1)
  const max = Math.max(...series.map(point => point.value), 1)
  const points = series.map((point, index) => `${index * 704 / Math.max(series.length - 1, 1)},${160 - point.value / max * 160}`)
  const devices = report.tables.find(table => table.title === 'Dispositivos')
  const deviceTotal = devices?.rows.reduce((sum, row) => sum + Number(row[1]), 0) ?? 0
  const groups: Record<string, string[]> = { audience: ['Fuentes y campañas', 'Páginas más vistas'], commerce: ['Productos más vistos', 'Embudo de compra', 'Etapas de compra'], detail: ['Evolución diaria', 'Dispositivos'] }
  return <div className="space-y-5">
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
      {SUMMARY_LABELS.map((label, index) => {
        const current = report.summary[index] ?? 0
        const previous = report.previous[index] ?? 0
        const change = previous ? (current - previous) / previous * 100 : 0
        return <div key={label} className={`${card} relative overflow-hidden p-4 sm:p-5 ${index === 4 ? 'col-span-2 xl:col-span-1 ring-1 ring-accent-gold/25' : ''}`}>
          <div aria-hidden="true" className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-accent-gold/70 to-transparent" />
          <div className="flex justify-between items-center mb-5"><p className="text-xs text-text-secondary font-medium">{label}</p><span aria-hidden="true" className="text-accent-gold text-sm">{['◎', '↗', '▤', '◇', '$'][index]}</span></div>
          <p className="font-display text-3xl tracking-tight tabular-nums">{index === 4 ? money.format(current) : number.format(current)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            {previous > 0 && <span className={`rounded-md px-1.5 py-0.5 font-semibold ${change > 0 ? 'bg-success/10 text-success' : change < 0 ? 'bg-warning/10 text-warning' : 'bg-surface-2 text-text-secondary'}`}>{change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change).toFixed(1)}%</span>}
            <span className="text-text-secondary">{previous > 0 ? 'vs. período anterior' : changeLabel(current, previous)}</span>
          </div>
        </div>
      })}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className={`${card} p-5 sm:p-6 xl:col-span-2 min-w-0`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div><h3 className="font-semibold text-sm">El pulso de tu tienda</h3><p className="text-xs text-text-secondary mt-1">Evolución diaria · {date(report.range.from)} — {date(report.range.to)}</p></div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-surface-2/60 p-1" aria-label="Métrica del gráfico">
            {[['Usuarios', 0], ['Sesiones', 1], ['Ingresos', 4]].map(([label, value]) => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(Number(value))} className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all motion-safe:active:scale-95 ${metric === value ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>{label}</button>)}
          </div>
        </div>
        <div className="flex gap-3 h-48 pt-4">
          <div aria-hidden="true" className="flex flex-col justify-between w-10 shrink-0 text-[10px] text-text-secondary text-right tabular-nums">{[1, 0.5, 0].map(ratio => <span key={ratio}>{number.format(max * ratio)}</span>)}</div>
        <svg viewBox="0 0 704 160" preserveAspectRatio="none" className="w-full h-full overflow-visible min-w-0" role="img" aria-label={`${SUMMARY_LABELS[metric]} por día. Valores exactos en Detalle diario.`}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-accent-gold)" stopOpacity=".22" /><stop offset="100%" stopColor="var(--color-accent-gold)" stopOpacity="0" /></linearGradient></defs>
          {[0, 0.5, 1].map(ratio => <line key={ratio} x1="0" x2="704" y1={160 - ratio * 160} y2={160 - ratio * 160} stroke="var(--color-border)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />)}
          <path d={`M${points[0]} L${points.join(' L')} L${series.length > 1 ? 704 : 0},160 L0,160 Z`} fill={`url(#${gradientId})`} />
          <polyline points={points.join(' ')} fill="none" stroke="var(--color-accent-gold)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {series.length === 1 && <circle cx="0" cy={160 - series[0].value / max * 160} r="4" fill="var(--color-accent-gold)" />}
        </svg>
        </div>
        <div aria-hidden="true" className="flex justify-between ml-13 mt-3 text-[10px] text-text-secondary"><span>{date(report.range.from)}</span><span>{date(report.range.to)}</span></div>
        {series.every(point => point.value === 0) && <p className="text-xs text-text-secondary text-center">Sin actividad para esta métrica en el período.</p>}
      </div>
      <div className={`${card} p-5 sm:p-6`}>
        <h3 className="font-semibold text-sm">¿Desde dónde te visitan?</h3><p className="text-xs text-text-secondary mt-1 mb-6">Sesiones por dispositivo</p>
        <p className="font-display text-3xl tabular-nums mb-6">{number.format(deviceTotal)} <span className="font-sans text-xs text-text-secondary">sesiones</span></p>
        <div className="space-y-5">{devices?.rows.map((row, index) => {
          const percent = deviceTotal ? Number(row[1]) / deviceTotal * 100 : 0
          return <div key={String(row[0])}><div className="flex justify-between gap-2 text-xs mb-2"><span>{({ mobile: 'Móvil', desktop: 'Computadora', tablet: 'Tablet' } as Record<string, string>)[String(row[0])] ?? row[0]}</span><span className="text-text-secondary tabular-nums">{number.format(Number(row[1]))} · {percent.toFixed(0)}%</span></div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full rounded-full bg-accent-gold" style={{ width: `${percent}%`, opacity: 1 - Math.min(index, 3) * 0.18 }} /></div></div>
        })}{!devices?.rows.length && <p className="text-xs text-text-secondary">Sin datos de dispositivos.</p>}</div>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <div><h3 className="font-display text-lg">Una mirada más profunda</h3><p className="text-xs text-text-secondary mt-1">Descubre qué atrae visitantes y qué genera compras.</p></div>
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1" aria-label="Secciones del informe">
        {[['audience', 'Audiencia y tráfico'], ['commerce', 'Productos y compras'], ['detail', 'Detalle diario']].map(([value, label]) => <button type="button" key={value} aria-pressed={section === value} onClick={() => setSection(value)} className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-medium transition-all motion-safe:active:scale-95 ${section === value ? 'bg-accent-gold/15 text-text-primary' : 'text-text-secondary hover:bg-surface-2'}`}>{label}</button>)}
      </div>
    </div>
    <div className="grid grid-cols-1 gap-5" aria-live="polite">{report.tables.filter(table => groups[section].includes(table.title)).map(table => <DataTable key={table.title} table={table} />)}</div>
    <details className={`${card} p-4 text-xs text-text-secondary`}>
      <summary className="cursor-pointer font-medium">Acerca de estos datos · límites y metodología</summary>
      <div className="mt-3 space-y-2 leading-relaxed">
        <p>GA4 depende del consentimiento, los bloqueadores y el procesamiento de Google. Sus cifras pueden diferir de las ventas internas. El período actual puede estar incompleto.</p>
        <p>Etapas de compra muestra eventos independientes. El embudo secuencial cuenta usuarios que completan visita → producto → carrito → checkout → compra en orden dentro del período, con eventos intermedios y distintas sesiones.</p>
        <p>Desgloses: hasta 50 filas principales. Los ingresos se muestran en USD. Zona horaria de la propiedad: {report.timeZone}.</p>
        {report.warnings.map(warning => <p key={warning}>{warning}</p>)}
      </div>
    </details>
    {!!report.warnings.length && <p role="status" className="text-xs text-warning">Hay {report.warnings.length} aviso(s) de disponibilidad o calidad de datos. Consulta «Acerca de estos datos».</p>}
  </div>
}
