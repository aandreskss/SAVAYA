function IconTruck() {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="17" height="14" rx="1" />
      <path d="M18 10h5.5l2.5 4v4.5h-8V10z" />
      <circle cx="7"  cy="21.5" r="2" />
      <circle cx="21" cy="21.5" r="2" />
    </svg>
  )
}

function IconReturn() {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10a10 10 0 1 1 0 8" />
      <polyline points="1 6 4 10 8 7" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="13" width="18" height="12" rx="2" />
      <path d="M9 13V9a5 5 0 0 1 10 0v4" />
      <circle cx="14" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3L5 7v7c0 5.25 3.85 10.15 9 11.35C19.15 24.15 23 19.25 23 14V7L14 3z" />
      <polyline points="10 14 13 17 19 11" />
    </svg>
  )
}

const PROPS = [
  { Icon: IconTruck,  title: 'Envío rápido',        desc: 'Entregas en 2-5 días hábiles' },
  { Icon: IconReturn, title: 'Devolución fácil',     desc: '30 días para cambios' },
  { Icon: IconLock,   title: 'Pago seguro',          desc: 'Múltiples métodos de pago' },
  { Icon: IconShield, title: 'Calidad garantizada',  desc: 'Productos verificados' },
]

export default function ValueProps() {
  return (
    <section className="border-y border-gray-light bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-light">
          {PROPS.map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 px-4 py-4">
              <div className="text-accent shrink-0 opacity-70">
                <Icon />
              </div>
              <div>
                <p className="font-heading font-semibold text-xs text-black leading-tight">{title}</p>
                <p className="text-[10px] text-gray-text hidden md:block mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
