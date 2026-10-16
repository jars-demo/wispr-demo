'use client'

import { AnimatePresence, motion, MotionConfig } from 'motion/react'

import { LIMITS, SPEC_ITEM_COPY, SPEC_ITEM_KINDS, type SpecItemKind } from '@/domain/spec'

import { emptyItem, liveCodes, type Draft, type DraftItem } from './draft'

// Controlled editor for a checklist: three groups, each row editable, movable and removable.

const ADD_LABEL: Record<SpecItemKind, string> = {
  requirement: 'Add something to do',
  non_goal: 'Add something to leave alone',
  open_question: 'Add a question',
}

/** Short names for the move menu, so it stays narrow on phones. */
const KIND_SHORT: Record<SpecItemKind, string> = {
  requirement: 'To do',
  non_goal: 'Leave alone',
  open_question: 'Question',
}

const FIELD =
  'w-full resize-none rounded-xl bg-transparent px-3 py-2 text-[15px] leading-relaxed outline-none ' +
  'transition-colors placeholder:text-muted/70 hover:bg-surface-2/60 focus:bg-surface ' +
  'focus-visible:outline-2 focus-visible:outline-accent [field-sizing:content]'

function ItemRow({
  item,
  index,
  code,
  onChange,
  onRemove,
}: {
  item: DraftItem
  index: number
  code: string | undefined
  onChange: (next: DraftItem) => void
  onRemove: () => void
}) {
  const label = code ?? 'New item'
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32, delay: Math.min(index, 8) * 0.04 }}
      className="group flex flex-wrap gap-x-2 rounded-card bg-surface/70 p-2 sm:flex-nowrap"
    >
      <span className="w-8 shrink-0 pt-2.5 text-center font-mono text-xs font-semibold text-accent-text">
        {code ?? '•'}
      </span>
      <div className="flex min-w-0 flex-1 basis-[calc(100%-2.5rem)] flex-col sm:basis-auto">
        <textarea
          aria-label={`${label} text`}
          value={item.text}
          maxLength={LIMITS.itemText}
          rows={1}
          placeholder="Describe it in one sentence"
          onChange={(event) => onChange({ ...item, text: event.target.value })}
          className={FIELD}
        />
        {item.kind === 'requirement' ? (
          <input
            aria-label={`${label} done when`}
            value={item.acceptance ?? ''}
            maxLength={LIMITS.acceptance}
            placeholder="Done when… (optional)"
            onChange={(event) => onChange({ ...item, acceptance: event.target.value })}
            className={`${FIELD} text-sm text-ink-2`}
          />
        ) : null}
        {item.note ? <p className="px-3 pb-1 text-[13px] text-warn">{item.note}</p> : null}
        {item.sourceQuote ? (
          <p className="line-clamp-2 px-3 pb-1 text-[13px] text-muted" title={item.sourceQuote}>
            You said: &ldquo;{item.sourceQuote}&rdquo;
          </p>
        ) : null}
      </div>
      <div className="ml-10 flex w-full items-center justify-end gap-1 pt-1 sm:ml-0 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end">
        <label className="sr-only" htmlFor={`kind-${item.key}`}>
          Move {label}
        </label>
        <select
          id={`kind-${item.key}`}
          value={item.kind}
          onChange={(event) => onChange({ ...item, kind: event.target.value as SpecItemKind })}
          className="h-8 cursor-pointer rounded-full bg-surface-2 px-2.5 text-[12px] text-ink-2 outline-none focus-visible:outline-2 focus-visible:outline-accent"
        >
          {SPEC_ITEM_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_SHORT[kind]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-bad-wash hover:text-bad"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="m4 4 8 8m0-8-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </motion.li>
  )
}

export function ChecklistEditor({
  draft,
  onChange,
}: {
  draft: Draft
  onChange: (next: Draft) => void
}) {
  const codes = liveCodes(draft.items)
  const update = (key: string, next: DraftItem) =>
    onChange({ ...draft, items: draft.items.map((item) => (item.key === key ? next : item)) })
  const remove = (key: string) =>
    onChange({ ...draft, items: draft.items.filter((item) => item.key !== key) })
  const add = (kind: SpecItemKind) =>
    onChange({ ...draft, items: [...draft.items, emptyItem(kind)] })

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-8">
        <label className="flex flex-col gap-1.5">
          <span className="px-1 text-[13px] font-medium text-muted">Title</span>
          <input
            value={draft.title}
            maxLength={LIMITS.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            className="glass h-12 rounded-card px-4 text-lg font-semibold tracking-tight outline-none focus-visible:outline-2 focus-visible:outline-accent"
          />
        </label>

        {SPEC_ITEM_KINDS.map((kind) => {
          const items = draft.items.filter((item) => item.kind === kind)
          const headingId = `group-${kind}`
          return (
            <section key={kind} aria-labelledby={headingId} className="flex flex-col gap-2">
              <h2 id={headingId} className="px-1 text-[13px] font-medium text-muted">
                {SPEC_ITEM_COPY[kind].group}
                <span className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">
                  {items.length}
                </span>
              </h2>
              {items.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={true}>
                    {items.map((item, index) => (
                      <ItemRow
                        key={item.key}
                        index={index}
                        item={item}
                        code={codes.get(item.key)}
                        onChange={(next) => update(item.key, next)}
                        onRemove={() => remove(item.key)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              ) : null}
              <button
                type="button"
                onClick={() => add(kind)}
                className="self-start rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                + {ADD_LABEL[kind]}
              </button>
            </section>
          )
        })}
      </div>
    </MotionConfig>
  )
}
