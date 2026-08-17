'use client'

import { useState, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  onChange?: (id: string) => void
  className?: string
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '')
  const uid = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function activate(id: string) {
    setActiveTab(id)
    onChange?.(id)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (index + 1) % tabs.length
      tabRefs.current[next]?.focus()
      activate(tabs[next].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (index - 1 + tabs.length) % tabs.length
      tabRefs.current[prev]?.focus()
      activate(tabs[prev].id)
    }
  }

  const activeContent = tabs.find((t) => t.id === activeTab)?.content

  return (
    <div className={cn('w-full', className)}>
      {/* Tablist */}
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex overflow-x-auto border-b border-border gap-0 scrollbar-none"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el }}
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => activate(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'relative shrink-0 px-4 py-3 font-sans text-sm transition-colors duration-[150ms]',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-[-2px]',
                'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
                'after:transition-colors after:duration-[150ms]',
                isActive
                  ? 'text-text-primary font-medium after:bg-accent-gold'
                  : 'text-text-secondary hover:text-text-primary after:bg-transparent',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${uid}-panel-${tab.id}`}
          aria-labelledby={`${uid}-tab-${tab.id}`}
          hidden={tab.id !== activeTab}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          {tab.id === activeTab && activeContent}
        </div>
      ))}
    </div>
  )
}
