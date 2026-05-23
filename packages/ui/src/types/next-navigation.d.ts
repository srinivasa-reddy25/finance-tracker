declare module 'next/navigation' {
  type TNavigationOptions = {
    scroll?: boolean
  }

  type TAppRouter = {
    push: (href: string, options?: TNavigationOptions) => void
    replace: (href: string, options?: TNavigationOptions) => void
  }

  export const useRouter: () => TAppRouter
  export const usePathname: () => string
  export const useSearchParams: () => URLSearchParams
}
