import type { Request } from 'express'

export const extract_user_agent_info = (
  req: Request
): Record<string, string> => {
  const user_agent = req.headers['user-agent'] ?? 'unknown'
  const forwarded_for = req.headers['x-forwarded-for']
  const ip_from_proxy = Array.isArray(forwarded_for)
    ? forwarded_for[0]
    : forwarded_for

  return {
    user_agent,
    ip: req.ip || req.socket.remoteAddress || ip_from_proxy || 'unknown'
  }
}
