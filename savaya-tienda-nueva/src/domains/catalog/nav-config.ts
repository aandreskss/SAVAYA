export type NavCategory = {
  label: string
  href: string
  featured?: { name: string; href: string; imageUrl: string }[]
  subcategories?: { name: string; href: string }[]
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    label: 'Mujer',
    href: '/mujer',
    subcategories: [
      { name: 'Sandalias',   href: '/mujer/categoria/sandalias' },
      { name: 'Tacones',     href: '/mujer/categoria/tacones' },
      { name: 'Plataformas', href: '/mujer/categoria/plataformas' },
      { name: 'Flats',       href: '/mujer/categoria/flats' },
      { name: 'Botas',       href: '/mujer/categoria/botas' },
      { name: 'Sneakers',    href: '/mujer/categoria/sneakers' },
    ],
  },
  {
    label: 'Hombre',
    href: '/hombre',
    subcategories: [
      { name: 'Sneakers',         href: '/hombre/categoria/sneakers' },
      { name: 'Botas',            href: '/hombre/categoria/botas' },
      { name: 'Loafers',          href: '/hombre/categoria/loafers' },
      { name: 'Zapatos formales', href: '/hombre/categoria/zapatos-formales' },
      { name: 'Sandalias',        href: '/hombre/categoria/sandalias' },
    ],
  },
  { label: 'Nuevos', href: '/nuevos' },
  { label: 'Ofertas', href: '/ofertas' },
]

export const NAV_ACTIONS = {
  search: true,
  wishlist: true,
  cart: true,
  account: true,
}
