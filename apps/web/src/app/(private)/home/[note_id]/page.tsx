'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button, toast } from '@tejadev/ui'
import {
  useDeleteNoteById,
  useGetNoteById,
  useUpdateNoteById
} from '@/hooks/api/note'

type TProps = {
  params: Promise<{ note_id: string }>
}

export default function NoteDetailPage({ params }: TProps) {
  const router = useRouter()
  const { note_id } = use(params)

  const { data, isLoading } = useGetNoteById(note_id)
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNoteById()
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNoteById()

  const [note, setNote] = useState('')

  useEffect(() => {
    if (data?.data) {
      setNote(data.data.note)
    }
  }, [data])

  const onSave = () => {
    if (!note.trim()) return
    updateNote(
      { note_id, note },
      {
        onSuccess: () => toast('Note updated'),
        onError: () => toast.error('Failed to update note')
      }
    )
  }

  const onDelete = () => {
    deleteNote(note_id, {
      onSuccess: () => {
        toast('Note deleted')
        router.push('/home')
      },
      onError: () => toast.error('Failed to delete note')
    })
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:px-10 md:pb-10">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <h2 className="text-xl font-semibold text-foreground">Edit Note</h2>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && (
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={8}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-between">
            <Button
              disabled={isDeleting}
              size="sm"
              variant="destructive"
              onClick={onDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete Note'}
            </Button>
            <Button disabled={isUpdating || !note.trim()} onClick={onSave}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
