import Link from 'next/link'

import { Button } from '@tejadev/ui'

export default function AccessDeninedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button type="button">Go Back</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
