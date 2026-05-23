'use client'

import { useState } from 'react'

/*
  Hook to manage open/close state.
*/
export const useOpenClose = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((previous) => !previous)
  const onOpenChange = (openState: boolean) => setIsOpen(openState)

  return [isOpen, open, close, toggle, onOpenChange] as const
}
