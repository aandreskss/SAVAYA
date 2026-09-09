'use client'

import { useState } from 'react'
import { HomeSectionsEditor } from './HomeSectionsEditor'
import { BannersManager } from './BannersManager'
import { PopupsManager } from './PopupsManager'
import { GenderHeroEditor } from './GenderHeroEditor'
import { NavbarEditor } from './NavbarEditor'
import type { AdminSection, AdminBanner, AdminNavItem, AdminPopup } from '../types'
import type { GenderHero } from '@/domains/cms/repository'

type Tab = 'home' | 'hombre' | 'mujer' | 'navbar' | 'banners' | 'popups'

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Página home' },
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'navbar', label: 'Navbar' },
  { id: 'banners', label: 'Banners' },
  { id: 'popups', label: 'Popups' },
]

type Props = {
  sections: AdminSection[]
  banners: AdminBanner[]
  popups: AdminPopup[]
  navItems: AdminNavItem[]
  hombreHero: GenderHero | null
  mujerHero: GenderHero | null
}

export function ContenidoView({ sections, banners, popups, navItems, hombreHero, mujerHero }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-accent-gold text-accent-gold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'home' && <HomeSectionsEditor initialSections={sections} />}
      {activeTab === 'hombre' && <GenderHeroEditor slug="hombre" initial={hombreHero} />}
      {activeTab === 'mujer' && <GenderHeroEditor slug="mujer" initial={mujerHero} />}
      {activeTab === 'navbar' && <NavbarEditor initialItems={navItems} />}
      {activeTab === 'banners' && <BannersManager initialBanners={banners} />}
      {activeTab === 'popups' && <PopupsManager initialPopups={popups} />}
    </div>
  )
}
