'use client'

import { useState } from 'react'
import {
  Button,
  IconButton,
  Input,
  Select,
  Checkbox,
  Radio,
  Toggle,
  Badge,
  Chip,
  Price,
  Tabs,
  Accordion,
  Modal,
  Drawer,
  BottomSheet,
  ToastContainer,
  toast,
  Tooltip,
  Pagination,
  Skeleton,
  EmptyState,
  ErrorState,
  // Commerce
  ProductCard,
  ColorSelector,
  SizeSelector,
  QuantityStepper,
  Breadcrumb,
  KPICard,
  DataTable,
} from '@/shared/ui'
import type { Column } from '@/shared/ui'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-medium text-2xl text-text-primary mb-6 pb-2 border-b border-border">
      {children}
    </h2>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-xs font-medium text-text-secondary tracking-wider uppercase mb-3">
      {children}
    </p>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

// ─── Iconos de ejemplo ───────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 13.5C8 13.5 1.5 9.5 1.5 5.5a3 3 0 0 1 6.5-1 3 3 0 0 1 6.5 1C14.5 9.5 8 13.5 8 13.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="12" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 18h32" stroke="currentColor" strokeWidth="2" />
      <path d="M14 18V8M26 18V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Showcase ────────────────────────────────────────────────────────────────

// ─── Mock data para componentes de comercio ──────────────────────────────────

type ProductBadge = 'new' | 'bestseller' | 'sale' | 'low_stock' | 'web_exclusive'

const MOCK_PRODUCTS: Array<{
  id: string
  slug: string
  name: string
  basePrice: number
  compareAtPrice?: number
  currency: string
  images: { url: string; alt: string }[]
  availableColors: { id: string; name: string; hex: string }[]
  badges: ProductBadge[]
  isInWishlist?: boolean
}> = [
  {
    id: 'prod-1',
    slug: 'sandalia-cuero-negro',
    name: 'Sandalia de Cuero Negro',
    basePrice: 45,
    compareAtPrice: 60,
    currency: 'USD',
    images: [
      { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=533&fit=crop', alt: 'Sandalia cuero negro' },
      { url: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&h=533&fit=crop', alt: 'Sandalia cuero negro detalle' },
    ],
    availableColors: [
      { id: 'negro', name: 'Negro', hex: '#0A0A0A' },
      { id: 'beige', name: 'Beige', hex: '#D4C5B0' },
    ],
    badges: ['sale'],
    isInWishlist: false,
  },
  {
    id: 'prod-2',
    slug: 'tacon-clasico-nude',
    name: 'Tacón Clásico Nude',
    basePrice: 58,
    currency: 'USD',
    images: [
      { url: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400&h=533&fit=crop', alt: 'Tacón nude' },
    ],
    availableColors: [
      { id: 'nude', name: 'Nude', hex: '#D4C5B0' },
      { id: 'blanco', name: 'Blanco', hex: '#FFFFFF' },
      { id: 'rojo', name: 'Rojo', hex: '#C0362C' },
    ],
    badges: ['new', 'bestseller'],
    isInWishlist: true,
  },
  {
    id: 'prod-3',
    slug: 'mule-dorado-fiesta',
    name: 'Mule Dorado de Fiesta',
    basePrice: 72,
    compareAtPrice: 89,
    currency: 'USD',
    images: [
      { url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=533&fit=crop', alt: 'Mule dorado' },
    ],
    availableColors: [
      { id: 'dorado', name: 'Dorado', hex: '#C9A227' },
    ],
    badges: ['low_stock'],
  },
]

const MOCK_COLORS = [
  { id: 'negro', name: 'Negro', hex: '#0A0A0A', isAvailable: true },
  { id: 'beige', name: 'Beige', hex: '#D4C5B0', isAvailable: true },
  { id: 'rojo', name: 'Rojo', hex: '#C0362C', isAvailable: false },
  { id: 'nude', name: 'Nude', hex: '#E8D5B7', isAvailable: true },
]

const MOCK_SIZES = [
  { id: '35', name: '35', isAvailable: true },
  { id: '36', name: '36', isAvailable: true },
  { id: '37', name: '37', isAvailable: false },
  { id: '38', name: '38', isAvailable: true },
  { id: '39', name: '39', isAvailable: true },
  { id: '40', name: '40', isAvailable: true },
]

type OrderRow = { orderId: string; customer: string; total: string; status: string }

const MOCK_TABLE_DATA: OrderRow[] = [
  { orderId: '#1042', customer: 'María González', total: '$45.00', status: 'Entregado' },
  { orderId: '#1041', customer: 'Ana Rodríguez', total: '$58.00', status: 'En camino' },
  { orderId: '#1040', customer: 'Laura Martínez', total: '$72.00', status: 'Pendiente' },
]

const MOCK_TABLE_COLUMNS: Column<OrderRow>[] = [
  { key: 'orderId', header: 'Pedido', sortable: true },
  { key: 'customer', header: 'Cliente' },
  { key: 'total', header: 'Total', sortable: true },
  {
    key: 'status',
    header: 'Estado',
    cell: (row) => (
      <span
        className={
          row.status === 'Entregado'
            ? 'text-success font-medium'
            : row.status === 'En camino'
            ? 'text-warning font-medium'
            : 'text-text-secondary font-medium'
        }
      >
        {row.status}
      </span>
    ),
  },
]

function StatsIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 14l4-4 3 3 4-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function ComponentsShowcase() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toggleState, setToggleState] = useState(false)
  const [page, setPage] = useState(1)
  const [chips, setChips] = useState(['Talla 36', 'Talla 38', 'Color negro'])

  // Commerce state
  const [selectedColor, setSelectedColor] = useState<string | undefined>()
  const [selectedSize, setSelectedSize] = useState<string | undefined>()
  const [quantity, setQuantity] = useState(1)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  return (
    <>
      <ToastContainer />

      {/* ── Botones ──────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Botones</SectionTitle>
        <div className="space-y-6 bg-surface rounded-lg p-6 border border-border shadow-sm">
          <div>
            <SubTitle>Variantes</SubTitle>
            <Row>
              <Button variant="primary">Agregar al carrito</Button>
              <Button variant="secondary">Ver detalle</Button>
              <Button variant="ghost">Cancelar</Button>
              <Button variant="danger">Eliminar</Button>
            </Row>
          </div>
          <div>
            <SubTitle>Tamaños</SubTitle>
            <Row>
              <Button size="sm">Pequeño</Button>
              <Button size="md">Mediano</Button>
              <Button size="lg">Grande</Button>
            </Row>
          </div>
          <div>
            <SubTitle>Estados</SubTitle>
            <Row>
              <Button isLoading>Guardando</Button>
              <Button disabled>Deshabilitado</Button>
              <Button leftIcon={<SearchIcon />}>Con ícono</Button>
              <Button rightIcon={<HeartIcon />}>Favorito</Button>
            </Row>
          </div>
        </div>
      </section>

      {/* ── IconButtons ──────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Icon Buttons</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Row>
            <IconButton aria-label="Buscar" variant="default" icon={<SearchIcon />} />
            <IconButton aria-label="Favorito" variant="ghost" icon={<HeartIcon />} />
            <IconButton aria-label="Eliminar" variant="danger" icon={<HeartIcon />} />
            <IconButton aria-label="Buscar pequeño" variant="ghost" size="sm" icon={<SearchIcon />} />
            <IconButton aria-label="Buscar grande" variant="default" size="lg" icon={<SearchIcon />} />
          </Row>
        </div>
      </section>

      {/* ── Inputs ───────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Inputs</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-4 max-w-md">
          <Input label="Nombre completo" placeholder="Ej. María González" />
          <Input label="Email" placeholder="maria@ejemplo.com" isRequired />
          <Input label="Con error" placeholder="Ingresa tu email" error="El email no es válido" />
          <Input label="Con hint" placeholder="Al menos 8 caracteres" hint="Usa letras y números" />
          <Input label="Con ícono" leftAddon={<SearchIcon />} placeholder="Buscar productos..." />
        </div>
      </section>

      {/* ── Selects ──────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Selects</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-4 max-w-md">
          <Select label="Talla">
            <option value="">Selecciona una talla</option>
            <option value="35">35</option>
            <option value="36">36</option>
            <option value="37">37</option>
            <option value="38">38</option>
          </Select>
          <Select label="Estado" error="Selecciona un estado válido">
            <option value="">Selecciona</option>
          </Select>
        </div>
      </section>

      {/* ── Checkboxes, Radios, Toggle ───────────────────────────────── */}
      <section>
        <SectionTitle>Formularios</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-6">
          <div>
            <SubTitle>Checkboxes</SubTitle>
            <div className="space-y-3">
              <Checkbox label="Acepto los términos y condiciones" />
              <Checkbox
                label="Suscribirme al newsletter"
                description="Recibe las últimas novedades y ofertas exclusivas"
                defaultChecked
              />
              <Checkbox label="Opción con error" error="Este campo es obligatorio" />
            </div>
          </div>
          <div>
            <SubTitle>Radios</SubTitle>
            <div className="space-y-3">
              <Radio name="envio" label="Envío estándar (3-5 días)" defaultChecked />
              <Radio name="envio" label="Envío express (1-2 días)" description="Costo adicional de $5" />
            </div>
          </div>
          <div>
            <SubTitle>Toggles</SubTitle>
            <div className="space-y-3">
              <Toggle label="Notificaciones activas" checked={toggleState} onChange={setToggleState} />
              <Toggle label="Tamaño sm" checked size="sm" onChange={() => {}} />
              <Toggle label="Deshabilitado" checked={false} disabled onChange={() => {}} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Badges ───────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Badges</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-4">
          <div>
            <SubTitle>Variantes</SubTitle>
            <Row>
              <Badge variant="default">Nuevo</Badge>
              <Badge variant="gold">Bestseller</Badge>
              <Badge variant="success">En stock</Badge>
              <Badge variant="warning">Últimas unidades</Badge>
              <Badge variant="error">Agotado</Badge>
              <Badge variant="outline">Exclusivo web</Badge>
            </Row>
          </div>
          <div>
            <SubTitle>Tamaños</SubTitle>
            <Row>
              <Badge size="sm">sm</Badge>
              <Badge size="md">md</Badge>
            </Row>
          </div>
        </div>
      </section>

      {/* ── Chips ────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Chips</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <SubTitle>Filtros activos</SubTitle>
          <Row>
            {chips.map((chip) => (
              <Chip
                key={chip}
                onRemove={() => setChips((prev) => prev.filter((c) => c !== chip))}
              >
                {chip}
              </Chip>
            ))}
            {chips.length === 0 && (
              <span className="font-sans text-sm text-text-secondary italic">
                Sin filtros activos
              </span>
            )}
          </Row>
        </div>
      </section>

      {/* ── Price ────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Price</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-4">
          <div>
            <SubTitle>Sin descuento</SubTitle>
            <Price amount={45} currency="USD" size="lg" />
          </div>
          <div>
            <SubTitle>Con descuento</SubTitle>
            <Price amount={32} currency="USD" compareAtAmount={45} discountBadge="-29%" size="lg" />
          </div>
          <div>
            <SubTitle>Tamaños</SubTitle>
            <div className="space-y-2">
              <Price amount={45} size="sm" />
              <Price amount={45} size="md" />
              <Price amount={45} size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Tabs</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Tabs
            tabs={[
              { id: 'desc', label: 'Descripción', content: <p className="font-sans text-sm text-text-secondary">Descripción del producto. Material premium, confección venezolana.</p> },
              { id: 'care', label: 'Cuidados', content: <p className="font-sans text-sm text-text-secondary">Limpiar con paño seco. No exponer a humedad prolongada.</p> },
              { id: 'shipping', label: 'Envíos', content: <p className="font-sans text-sm text-text-secondary">Envíos a todo Venezuela en 3-5 días hábiles.</p> },
            ]}
          />
        </div>
      </section>

      {/* ── Accordion ────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Accordion</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Accordion
            items={[
              { id: 'a1', trigger: 'Política de envíos', content: 'Enviamos a todo Venezuela en 3-5 días hábiles. El costo de envío se calcula en el checkout.' },
              { id: 'a2', trigger: 'Devoluciones y cambios', content: 'Tienes 15 días para devolver tu pedido en perfecto estado.' },
              { id: 'a3', trigger: 'Métodos de pago', content: 'Aceptamos transferencia bancaria, pago móvil y Zelle.' },
            ]}
          />
        </div>
      </section>

      {/* ── Modal ────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Modal</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Button onClick={() => setModalOpen(true)}>Abrir Modal</Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirmar compra"
          >
            <p className="font-sans text-sm text-text-secondary">
              Estás por confirmar tu pedido por un total de $45.00 USD. ¿Deseas continuar?
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setModalOpen(false)}>Confirmar</Button>
            </div>
          </Modal>
        </div>
      </section>

      {/* ── Drawer ───────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Drawer</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Abrir Drawer (derecha)
          </Button>
          <Drawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Carrito"
            side="right"
          >
            <p className="font-sans text-sm text-text-secondary">
              Aquí iría el contenido del carrito de compras.
            </p>
          </Drawer>
        </div>
      </section>

      {/* ── BottomSheet ──────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Bottom Sheet</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Abrir Bottom Sheet
          </Button>
          <BottomSheet
            isOpen={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Filtros"
          >
            <p className="font-sans text-sm text-text-secondary">
              Panel de filtros para mobile. Tallas, colores, precio.
            </p>
          </BottomSheet>
        </div>
      </section>

      {/* ── Toast ────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Toast</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-3">
          <SubTitle>Dispara una notificación</SubTitle>
          <Row>
            <Button
              variant="ghost"
              onClick={() => toast.success('¡Producto agregado al carrito!')}
            >
              Success
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast.error('No se pudo procesar el pago.')}
            >
              Error
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast.warning('Quedan pocas unidades disponibles.')}
            >
              Warning
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast.info('Tu pedido está en camino.')}
            >
              Info
            </Button>
          </Row>
        </div>
      </section>

      {/* ── Tooltip ──────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Tooltip</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Row>
            <Tooltip content="Agrega al carrito" side="top">
              <Button size="sm">Hover o focus aquí (top)</Button>
            </Tooltip>
            <Tooltip content="Ver detalles" side="bottom">
              <Button size="sm" variant="secondary">Tooltip bottom</Button>
            </Tooltip>
            <Tooltip content="Eliminar" side="right">
              <Button size="sm" variant="ghost">Tooltip right</Button>
            </Tooltip>
          </Row>
        </div>
      </section>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Pagination</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Pagination
            currentPage={page}
            totalPages={12}
            onPageChange={setPage}
            showFirstLast
          />
        </div>
      </section>

      {/* ── Skeleton ─────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Skeleton</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-4">
          <div className="flex gap-3 items-center">
            <Skeleton variant="circle" width={48} height={48} />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton variant="text" height={16} width="60%" />
              <Skeleton variant="text" height={12} width="40%" />
            </div>
          </div>
          <Skeleton variant="rect" height={160} />
          <div className="flex gap-3">
            <Skeleton variant="rect" height={120} className="flex-1" />
            <Skeleton variant="rect" height={120} className="flex-1" />
            <Skeleton variant="rect" height={120} className="flex-1" />
          </div>
        </div>
      </section>

      {/* ── EmptyState ───────────────────────────────────────────────── */}
      <section>
        <SectionTitle>EmptyState</SectionTitle>
        <div className="bg-surface rounded-lg border border-border shadow-sm">
          <EmptyState
            icon={<PackageIcon />}
            title="No hay productos en esta categoría"
            description="Pronto agregaremos nuevos artículos. ¡Vuelve pronto!"
            action={{ label: 'Ver todas las categorías', onClick: () => {} }}
          />
        </div>
      </section>

      {/* ── ErrorState ───────────────────────────────────────────────── */}
      <section>
        <SectionTitle>ErrorState</SectionTitle>
        <div className="bg-surface rounded-lg border border-border shadow-sm">
          <ErrorState
            title="No pudimos cargar los productos"
            description="Verifica tu conexión a internet e intenta de nuevo."
            onRetry={() => toast.info('Reintentando...')}
          />
        </div>
      </section>

      {/* ── ProductCard ──────────────────────────────────────────────── */}
      <section>
        <SectionTitle>ProductCard</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                isInWishlist={wishlistIds.has(product.id)}
                onWishlistToggle={(id) =>
                  setWishlistIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return next
                  })
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── ColorSelector ────────────────────────────────────────────── */}
      <section>
        <SectionTitle>ColorSelector</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <ColorSelector
            colors={MOCK_COLORS}
            selectedColorId={selectedColor}
            onChange={setSelectedColor}
            label="Color"
          />
        </div>
      </section>

      {/* ── SizeSelector ─────────────────────────────────────────────── */}
      <section>
        <SectionTitle>SizeSelector</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <SizeSelector
            sizes={MOCK_SIZES}
            selectedSizeId={selectedSize}
            onChange={setSelectedSize}
            label="Talla"
            onGuideClick={() => toast.info('Abre guía de tallas')}
          />
        </div>
      </section>

      {/* ── QuantityStepper ──────────────────────────────────────────── */}
      <section>
        <SectionTitle>QuantityStepper</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-4">
          <div>
            <SubTitle>Interactivo</SubTitle>
            <QuantityStepper
              value={quantity}
              min={1}
              max={10}
              onChange={setQuantity}
            />
          </div>
          <div>
            <SubTitle>Deshabilitado</SubTitle>
            <QuantityStepper
              value={1}
              min={1}
              max={10}
              onChange={() => {}}
              disabled
            />
          </div>
        </div>
      </section>

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Breadcrumb</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <Breadcrumb
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Mujer', href: '/categoria/mujer' },
              { label: 'Sandalias' },
            ]}
          />
        </div>
      </section>

      {/* ── KPICard ──────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>KPICard</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard
              label="Ventas del mes"
              value="$4,280"
              trend="up"
              trendValue="+12%"
              subValue="vs. mes pasado"
              icon={<StatsIcon />}
            />
            <KPICard
              label="Pedidos pendientes"
              value={23}
              trend="neutral"
              trendValue="0%"
              subValue="sin cambios"
            />
            <KPICard
              label="Tasa de conversión"
              value="3.4%"
              trend="down"
              trendValue="-0.8%"
              subValue="vs. semana pasada"
            />
          </div>
          <div className="mt-4">
            <SubTitle>Con loading skeleton</SubTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard label="Cargando..." value="" isLoading />
            </div>
          </div>
        </div>
      </section>

      {/* ── DataTable ────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>DataTable</SectionTitle>
        <div className="bg-surface rounded-lg p-6 border border-border shadow-sm space-y-6">
          <div>
            <SubTitle>Con datos</SubTitle>
            <DataTable<OrderRow>
              data={MOCK_TABLE_DATA}
              columns={MOCK_TABLE_COLUMNS}
              currentSort={{ key: 'orderId', direction: 'desc' }}
              onSort={(key, dir) => toast.info(`Ordenar por ${key} ${dir}`)}
            />
          </div>
          <div>
            <SubTitle>Con loading skeleton</SubTitle>
            <DataTable<OrderRow>
              data={[]}
              columns={MOCK_TABLE_COLUMNS}
              isLoading
            />
          </div>
          <div>
            <SubTitle>Estado vacío</SubTitle>
            <DataTable<OrderRow>
              data={[]}
              columns={MOCK_TABLE_COLUMNS}
              emptyMessage="No hay pedidos para mostrar"
            />
          </div>
        </div>
      </section>
    </>
  )
}
