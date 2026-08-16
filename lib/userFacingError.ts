type SupabaseLikeError = {
  code?: string | null
  message?: string | null
}

export function isAuthenticationExpired(error: SupabaseLikeError | null | undefined) {
  const code = String(error?.code ?? '').toLowerCase()
  const message = String(error?.message ?? '').toLowerCase()

  return (
    code.includes('jwt') ||
    code.includes('refresh_token') ||
    code === 'session_not_found' ||
    message.includes('jwt') ||
    (message.includes('session') && (message.includes('expired') || message.includes('missing'))) ||
    (message.includes('refresh token') && (message.includes('invalid') || message.includes('not found')))
  )
}

export function userFacingError(
  error: SupabaseLikeError | null | undefined,
  fallback: string
) {
  const code = String(error?.code ?? '').toLowerCase()
  const message = String(error?.message ?? '').toLowerCase()

  if (isAuthenticationExpired(error)) {
    return 'Tu sesión ha caducado. Vuelve a entrar para continuar.'
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('load failed')
  ) {
    return 'No hay conexión con LEVEL UP. Revisa internet e inténtalo de nuevo.'
  }

  if (
    code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied')
  ) {
    return 'No tienes permiso para acceder a esos datos con esta cuenta.'
  }

  if (code === '23505' || message.includes('duplicate key')) {
    return 'Ese dato ya está guardado. Prueba con otro nombre.'
  }

  return fallback
}
