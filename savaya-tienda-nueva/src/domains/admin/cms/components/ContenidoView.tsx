'use client'

import { useState } from 'react'
import { HomeSectionsEditor } from './HomeSectionsEditor'
import { BannersManager } from './BannersManager'
import { PopupsManager } from './PopupsManager'
import type { AdminSection, AdminBanner, AdminPopup } from '../types'

type Tab = 'home' | 'banners' | 'popups'

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Página home' },
  { id: 'banners', label: 'Banners' },
  { id: 'popups', label: 'Popups' },
]

type Props = {
  sections: AdminSection[]
  banners: AdminBanner[]
  popups: AdminPopup[]
}

export function ContenidoView({ sections, banners, popups }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
      {activeTab === 'banners' && <BannersManager initialBanners={banners} />}
      {activeTab === 'popups' && <PopupsManager initialPopups={popups} />}
    </div>
  )
}
