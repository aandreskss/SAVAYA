'use client'

import { useRef, useState, type DragEvent } from 'react'
import { COLORS, CLOTHING_SIZES } from '@/lib/constants'
import { useCustomColors } from '@/hooks/useCustomColors'
import type { VariantInput } from '@/app/dashboard/productos/actions'

export type VariantRow = VariantInput & { tempId: string }

interface VariantsManagerProps {
  variants: VariantRow[]
  deletedIds: string[]
  onVariantsChange: (variants: VariantRow[], deletedIds: string[]) => void
  error?: string
}

const COMMON_SIZES = [...CLOTHING_SIZES, '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

function parseHex(colorHex: string): [string, string | undefined] {
  const [h1, h2] = colorHex.split('|')
  return [h1 ?? '#111111', h2 || undefined]
}

export function swatchStyle(colorHex: string): React.CSSProperties {
  const [h1, h2] = parseHex(colorHex)
  if (h2) return { background: `linear-gradient(135deg, ${h1} 50%, ${h2} 50%)` }
  return { backgroundColor: h1 }
}

function isPreset(name: string) {
  return COLORS.some((c) => c.name === name)
}

function newRow(): VariantRow {
  return {
    tempId: crypto.randomUUID(),
    size: '',
    color: COLORS[0].name,
    color_hex: COLORS[0].hex,
    stock: 0,
    sku: '',
  }
}

function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" className="text-gray-text">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="9" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="9" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" />
      <circle cx="9" cy="13" r="1.5" />
    </svg>
  )
}

export default function VariantsManager({
  variants,
  deletedIds,
  onVariantsChange,
  error,
}: VariantsManagerProps) {
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const draggedIndex = useRef<number | null>(null)
  const { customColors, saveColor, removeColor } = useCustomColors()

  // ─── Variants CRUD ────────────────────────────────────────────────────────────

  function addRow() {
    onVariantsChange([...variants, newRow()], deletedIds)
  }

  function removeRow(tempId: string) {
    const row = variants.find((v) => v.tempId === tempId)
    const newDeleted = row?.productVariantId
      ? [...deletedIds, row.productVariantId]
      : deletedIds
    onVariantsChange(variants.filter((v) => v.tempId !== tempId), newDeleted)
  }

  function updateRow(tempId: string, field: keyof VariantRow, value: string | number) {
    if (field === 'sku') {
      const row = variants.find((v) => v.tempId === tempId)
      if (row) {
        onVariantsChange(
          variants.map((v) =>
            v.tempId === tempId || v.color === row.color
              ? { ...v, sku: value as string }
              : v
          ),
          deletedIds
        )
        return
      }
    }
    onVariantsChange(
      variants.map((v) => (v.tempId === tempId ? { ...v, [field]: value } : v)),
      deletedIds
    )
  }

  // ─── Color picker ─────────────────────────────────────────────────────────────

  function selectColor(tempId: string, name: string, hex: string) {
    const existingSku = variants.find((v) => v.color === name && v.tempId !== tempId)?.sku ?? ''
    onVariantsChange(
      variants.map((v) =>
        v.tempId === tempId ? { ...v, color: name, color_hex: hex, sku: existingSku } : v
      ),
      deletedIds
    )
    setShowColorPicker(null)
  }

  function updateHex1(tempId: string, newHex1: string) {
    const row = variants.find((v) => v.tempId === tempId)!
    const [, h2] = parseHex(row.color_hex)
    updateRow(tempId, 'color_hex', h2 ? `${newHex1}|${h2}` : newHex1)
  }

  function updateHex2(tempId: string, newHex2: string) {
    const row = variants.find((v) => v.tempId === tempId)!
    const [h1] = parseHex(row.color_hex)
    updateRow(tempId, 'color_hex', newHex2 ? `${h1}|${newHex2}` : h1)
  }

  function addSecondHex(tempId: string) {
    const row = variants.find((v) => v.tempId === tempId)!
    const [h1] = parseHex(row.color_hex)
    updateRow(tempId, 'color_hex', `${h1}|#FFFFFF`)
  }

  function removeSecondHex(tempId: string) {
    const row = variants.find((v) => v.tempId === tempId)!
    const [h1] = parseHex(row.color_hex)
    updateRow(tempId, 'color_hex', h1)
  }

  // ─── Drag and drop reorder ────────────────────────────────────────────────────

  function handleDragStart(e: DragEvent<HTMLTableRowElement>, index: number, tempId: string) {
    draggedIndex.current = index
    setDraggingId(tempId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: DragEvent<HTMLTableRowElement>, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex.current === null || draggedIndex.current === index) return
    const newVariants = [...variants]
    const [moved] = newVariants.splice(draggedIndex.current, 1)
    newVariants.splice(index, 0, moved)
    draggedIndex.current = index
    onVariantsChange(newVariants, deletedIds)
  }

  function handleDragEnd() {
    draggedIndex.current = null
    setDraggingId(null)
  }

  // ─── Misc ─────────────────────────────────────────────────────────────────────

  const skuByColor: Record<string, number> = {}
  variants.forEach((v) => {
    if (v.color) skuByColor[v.color] = (skuByColor[v.color] ?? 0) + 1
  })

  const showDragHandle = variants.length > 1

  return (
    <div>
      {variants.length > 0 && (
        <>
          <p className="text-[11px] text-gray-text font-body mb-2">
            El SKU/Ref se comparte entre todas las variantes del mismo color — escríbelo en una fila y se aplica a todas.
            {showDragHandle && ' Arrastra ⠿ para cambiar el orden de los colores.'}
          </p>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="text-[11px] text-gray-text font-heading font-semibold uppercase tracking-wider border-b border-gray-light">
                  {showDragHandle && <th className="pb-2 w-5" />}
                  <th className="text-left pb-2 pr-3 min-w-[100px]">Talla</th>
                  <th className="text-left pb-2 pr-3 min-w-[160px]">Color</th>
                  <th className="text-left pb-2 pr-3 w-24">Stock</th>
                  <th className="text-left pb-2 pr-3 min-w-[140px]">Ref / SKU</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-light">
                {variants.map((row, index) => {
                  const [h1, h2] = parseHex(row.color_hex)
                  const isPickerOpen = showColorPicker === row.tempId
                  const isDragging = draggingId === row.tempId

                  return (
                    <tr
                      key={row.tempId}
                      draggable={showDragHandle}
                      onDragStart={(e) => handleDragStart(e, index, row.tempId)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={isDragging ? 'opacity-40' : undefined}
                    >
                      {/* Drag handle */}
                      {showDragHandle && (
                        <td className="py-2 pr-2 cursor-grab active:cursor-grabbing select-none">
                          <GripIcon />
                        </td>
                      )}

                      {/* Talla */}
                      <td className="py-2 pr-3">
                        <input
                          list={`sizes-${row.tempId}`}
                          value={row.size}
                          onChange={(e) => updateRow(row.tempId, 'size', e.target.value)}
                          placeholder="Talla"
                          className="w-full border border-gray-light rounded px-2 py-1.5 text-sm font-body focus:border-black focus:outline-none"
                        />
                        <datalist id={`sizes-${row.tempId}`}>
                          {COMMON_SIZES.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </td>

                      {/* Color */}
                      <td className="py-2 pr-3 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowColorPicker(isPickerOpen ? null : row.tempId)
                          }
                          className="flex items-center gap-2 w-full border border-gray-light rounded px-2 py-1.5 text-sm font-body hover:border-black transition-colors text-left"
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border border-gray-light"
                            style={swatchStyle(row.color_hex)}
                          />
                          <span className="truncate">{row.color || 'Seleccionar'}</span>
                        </button>

                        {isPickerOpen && (
                          <div className="absolute top-full left-0 z-20 mt-1 bg-white border border-gray-light rounded shadow-md p-3 w-60">

                            {/* Predefined */}
                            <p className="text-[10px] text-gray-text font-heading font-semibold uppercase tracking-wider mb-1.5">
                              Predefinidos
                            </p>
                            <div className="grid grid-cols-5 gap-1 mb-3">
                              {COLORS.map((c) => (
                                <button
                                  key={c.name}
                                  type="button"
                                  title={c.name}
                                  onClick={() => selectColor(row.tempId, c.name, c.hex)}
                                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: c.hex,
                                    borderColor: row.color === c.name ? '#111' : '#e5e5e5',
                                  }}
                                />
                              ))}
                            </div>

                            {/* My saved colors */}
                            {customColors.length > 0 && (
                              <>
                                <p className="text-[10px] text-gray-text font-heading font-semibold uppercase tracking-wider mb-1.5 border-t border-gray-light pt-2.5">
                                  Mis colores
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {customColors.map((c) => (
                                    <div key={c.name} className="relative group">
                                      <button
                                        type="button"
                                        title={c.name}
                                        onClick={() => selectColor(row.tempId, c.name, c.hex)}
                                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                                        style={{
                                          ...swatchStyle(c.hex),
                                          borderColor: row.color === c.name ? '#111' : '#e5e5e5',
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeColor(c.name)}
                                        title={`Eliminar "${c.name}"`}
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sale text-white rounded-full text-[8px] leading-none items-center justify-center hidden group-hover:flex"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* Custom */}
                            <div className="border-t border-gray-light pt-2.5 space-y-2">
                              <p className="text-[10px] text-gray-text font-heading font-semibold uppercase tracking-wider">
                                Personalizado
                              </p>

                              <input
                                type="text"
                                value={row.color}
                                onChange={(e) => updateRow(row.tempId, 'color', e.target.value)}
                                placeholder="Nombre (ej: Blanco y Negro)"
                                className="w-full border border-gray-light rounded px-2 py-1.5 text-xs font-body focus:outline-none focus:border-black"
                              />

                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={h1}
                                  onChange={(e) => updateHex1(row.tempId, e.target.value)}
                                  className="w-7 h-7 rounded border border-gray-light cursor-pointer shrink-0"
                                />
                                <span className="text-[11px] text-gray-text font-body flex-1">
                                  {h2 ? 'Color 1' : 'Color'}
                                </span>
                                {!h2 && (
                                  <button
                                    type="button"
                                    onClick={() => addSecondHex(row.tempId)}
                                    className="text-[11px] text-gray-text hover:text-black transition-colors font-body underline"
                                  >
                                    + 2º color
                                  </button>
                                )}
                              </div>

                              {h2 && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={h2}
                                    onChange={(e) => updateHex2(row.tempId, e.target.value)}
                                    className="w-7 h-7 rounded border border-gray-light cursor-pointer shrink-0"
                                  />
                                  <span className="text-[11px] text-gray-text font-body flex-1">Color 2</span>
                                  <button
                                    type="button"
                                    onClick={() => removeSecondHex(row.tempId)}
                                    className="text-[11px] text-gray-text hover:text-sale transition-colors font-body underline"
                                  >
                                    Quitar
                                  </button>
                                </div>
                              )}

                              {h2 && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span
                                    className="w-6 h-6 rounded-full border border-gray-light shrink-0"
                                    style={swatchStyle(row.color_hex)}
                                  />
                                  <span className="text-[11px] text-gray-text font-body">
                                    Preview bicolor
                                  </span>
                                </div>
                              )}

                              {/* Save button — only for non-preset colors */}
                              {row.color.trim() && !isPreset(row.color) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    saveColor(row.color, row.color_hex)
                                    setShowColorPicker(null)
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-heading font-semibold border border-black rounded px-2 py-1.5 hover:bg-black hover:text-white transition-colors"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                  </svg>
                                  Guardar color
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          value={row.stock}
                          onChange={(e) => updateRow(row.tempId, 'stock', Number(e.target.value))}
                          className="w-full border border-gray-light rounded px-2 py-1.5 text-sm font-body focus:border-black focus:outline-none"
                        />
                      </td>

                      {/* Ref / SKU */}
                      <td className="py-2 pr-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={row.sku}
                            onChange={(e) => updateRow(row.tempId, 'sku', e.target.value)}
                            placeholder="REF-001"
                            className="w-full border border-gray-light rounded px-2 py-1.5 text-sm font-body focus:border-black focus:outline-none"
                          />
                          {row.color && skuByColor[row.color] > 1 && (
                            <span
                              title={`Compartida con todas las variantes ${row.color}`}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-heading font-semibold text-gray-text bg-gray-bg rounded px-1"
                            >
                              ×{skuByColor[row.color]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Remove */}
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(row.tempId)}
                          className="text-gray-text hover:text-sale transition-colors p-1"
                          aria-label="Eliminar variante"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 text-sm font-body text-black border border-dashed border-gray-light rounded px-4 py-2 hover:border-black transition-colors w-full justify-center"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar variante
      </button>

      {error && (
        <p className="text-sm text-sale font-body mt-2">{error}</p>
      )}
    </div>
  )
}
