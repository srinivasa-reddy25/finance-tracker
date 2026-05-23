'use client'

import Link from 'next/link'

import { Button, Card, CardContent } from '@tejadev/ui'
import { useGetAllNotes } from '@/hooks/api/note'
import { useAuth } from '@/providers/auth-provider'

export default function HomePage() {
  const { user } = useAuth()
  const { data, isLoading } = useGetAllNotes()

  const notes = data?.data ?? []

  if (!user) return null

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6 md:px-10 md:pb-10">
      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Welcome back
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-primary">
          {user.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          This is a demo notes feature built into the TejaDev Template. Fork
          this repo, swap out the notes model with your own domain, and you are
          ready to ship.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Notes</h3>
          <Button asChild size="sm">
            <Link href="/home/new">+ New Note</Link>
          </Button>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        )}

        {!isLoading && notes.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No notes yet. Create your first one.
            </p>
          </div>
        )}

        {!isLoading && notes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {notes.map((note) => (
              <Link key={note._id} href={`/home/${note._id}`}>
                <Card className="cursor-pointer transition-colors hover:border-primary">
                  <CardContent className="p-4">
                    <p className="line-clamp-3 text-sm text-foreground">
                      {note.note}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {note.createdAt
                        ? new Date(note.createdAt).toLocaleDateString()
                        : ''}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
