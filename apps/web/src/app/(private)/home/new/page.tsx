'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button, toast } from '@tejadev/ui'
import { useCreateNote } from '@/hooks/api/note'

export default function NewNotePage() {
  const router = useRouter()
  const [note, setNote] = useState('')
  const { mutate: createNote, isPending } = useCreateNote()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return

    createNote(
      { note },
      {
        onSuccess: (res) => {
          toast('Note created')
          router.push(`/home/${res.data.note_id}`)
        },
        onError: () => {
          toast.error('Failed to create note')
        }
      }
    )
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:px-10 md:pb-10">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <h2 className="text-xl font-semibold text-foreground">New Note</h2>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <textarea
          className="w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Write your note here..."
          rows={8}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end">
          <Button disabled={isPending || !note.trim()} type="submit">
            {isPending ? 'Creating...' : 'Create Note'}
          </Button>
        </div>
      </form>
    </main>
  )
}
