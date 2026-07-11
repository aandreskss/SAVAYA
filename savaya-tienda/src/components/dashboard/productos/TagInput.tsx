'use client'

import { useState, useRef, type KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || tags.includes(tag) || tags.length >= 15) return
    onChange([...tags, tag])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      <div
        className="min-h-10 w-full border border-gray-light rounded px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text focus-within:border-black transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-gray-bg text-black text-xs font-body px-2 py-0.5 rounded"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="text-gray-text hover:text-black transition-colors leading-none"
              aria-label={`Eliminar ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? 'Escribe un tag y presiona Enter…' : ''}
          className="flex-1 min-w-24 text-sm font-body bg-transparent outline-none"
        />
      </div>
      <p className="text-[11px] text-gray-text font-body mt-1">
        Enter o coma para agregar · Máximo 15 tags
      </p>
    </div>
  )
}
