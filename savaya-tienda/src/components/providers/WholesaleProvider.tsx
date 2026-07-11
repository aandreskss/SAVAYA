'use client'

import { createContext, useContext } from 'react'

const WholesaleContext = createContext<number>(6)

export function WholesaleProvider({ minQty, children }: { minQty: number; children: React.ReactNode }) {
  return <WholesaleContext.Provider value={minQty}>{children}</WholesaleContext.Provider>
}

export function useWholesaleMinQty() {
  return useContext(WholesaleContext)
}
