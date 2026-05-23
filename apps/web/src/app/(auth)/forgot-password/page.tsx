'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import Link from 'next/link'

import { Button, Card, CardContent, Input, Label, toast } from '@tejadev/ui'
import { resetPassword } from '@/services/auth'

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const errorMessage = (error as { message?: unknown }).message
    if (typeof errorMessage === 'string' && errorMessage.trim()) {
      return errorMessage
    }
  }
  return 'Something went wrong. Please try again.'
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (error) {
      toast.error('Failed to send reset email', {
        description: getErrorMessage(error)
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-6 md:p-8">
              {resetSent ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Check your inbox</h1>
                    <p className="text-balance text-muted-foreground">
                      We sent a password reset link to{' '}
                      <span className="font-medium text-foreground">
                        {email}
                      </span>
                      . Click it to set a new password, then come back to log
                      in.
                    </p>
                  </div>
                  <Link href="/login">
                    <Button className="w-full" type="button" variant="outline">
                      Back to login
                    </Button>
                  </Link>
                </div>
              ) : (
                <form className="flex flex-col gap-6" onSubmit={onSubmit}>
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">
                      Forgot your password?
                    </h1>
                    <p className="text-balance text-muted-foreground">
                      Enter your email and we&apos;ll send you a reset link.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      required
                      id="email"
                      placeholder="m@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Sending...' : 'Send reset link'}
                  </Button>
                  <div className="text-center text-sm">
                    Remember your password?{' '}
                    <Link
                      className="underline underline-offset-4"
                      href="/login"
                    >
                      Back to login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            By clicking continue, you agree to our{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  )
}
