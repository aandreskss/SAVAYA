'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

export interface SizeGuideData {
  headers: string[]
  rows: string[][]
}

export default function SizeGuide({ guide }: { guide: SizeGuideData | null }) {
  const [open, setOpen] = useState(false)

  if (!guide || guide.headers.length === 0 || guide.rows.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm underline underline-offset-2 text-gray-text hover:text-black"
      >
        Guía de tallas
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Guía de tallas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-light">
                {guide.headers.map((h, i) => (
                  <th key={i} className="pb-2 pr-6 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-gray-bg">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`py-2 pr-6 ${ci === 0 ? 'font-medium' : ''}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  )
}
