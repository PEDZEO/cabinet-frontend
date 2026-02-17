function resolveHealthTone(status: string): 'healthy' | 'degraded' | 'critical' {
  if (status === 'healthy') return 'healthy';
  if (status === 'degraded') return 'degraded';
  return 'critical';
}

export function getNodeCardBorderClass(isConnected: boolean): string {
  return isConnected ? 'border-success-500/30' : 'border-dark-700';
}

export function getNodeDotClass(isConnected: boolean): string {
  return isConnected ? 'animate-pulse bg-success-500' : 'bg-dark-500';
}

export function getNodeStatusTextClass(isConnected: boolean): string {
  return isConnected ? 'text-success-400' : 'text-dark-400';
}

export function getAgentOnlineBadgeClass(isOnline: boolean): string {
  return isOnline ? 'bg-success-500/20 text-success-400' : 'bg-dark-600 text-dark-400';
}

export function getAgentHealthBadgeClass(status: string): string {
  const tone = resolveHealthTone(status);

  if (tone === 'healthy') return 'bg-success-500/20 text-success-400';
  if (tone === 'degraded') return 'bg-warning-500/20 text-warning-400';
  return 'bg-error-500/20 text-error-400';
}

export function getHealthDotClass(status: string): string {
  const tone = resolveHealthTone(status);

  if (tone === 'healthy') return 'bg-success-500';
  if (tone === 'degraded') return 'bg-warning-500';
  return 'bg-error-500';
}

export function getHealthPulseDotClass(status: string): string {
  return `animate-pulse ${getHealthDotClass(status)}`;
}

export function getHealthTextClass(status: string): string {
  const tone = resolveHealthTone(status);

  if (tone === 'healthy') return 'text-success-400';
  if (tone === 'degraded') return 'text-warning-400';
  return 'text-error-400';
}

export function getHealthCardBorderClass(status: string): string {
  const tone = resolveHealthTone(status);

  if (tone === 'healthy') return 'border-success-500/30';
  if (tone === 'degraded') return 'border-warning-500/30';
  return 'border-error-500/30';
}

export function getBooleanStatusBadgeClass(value: boolean): string {
  return value ? 'bg-success-500/20 text-success-400' : 'bg-warning-500/20 text-warning-400';
}

export function getOverLimitBadgeClass(value: boolean): string {
  return value ? 'bg-error-500/20 text-error-400' : 'bg-success-500/20 text-success-400';
}
