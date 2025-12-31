import './Badge.css'

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
  ...props
}) => {
  const classNames = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    dot && 'badge-dot',
    pulse && 'badge-pulse',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={classNames} {...props}>
      {dot && <span className="badge-dot-indicator"></span>}
      {children}
    </span>
  )
}

// Status badge with YAS colors ONLY
export const StatusBadge = ({ status, className = '', ...props }) => {
  const getVariant = (status) => {
    const statusLower = (status || '').toLowerCase()

    // Approved - Turquoise
    if (statusLower === 'approved') return 'primary'
    if (statusLower.includes('approved')) return 'primary'

    // Rejected / Need Access - Orange
    if (statusLower.includes('rejected')) return 'error'
    if (statusLower === 'need access') return 'error'

    // All "Under" statuses - Turquoise
    if (statusLower.includes('under')) return 'primary'

    // Site not Surveyed - Gray
    if (statusLower.includes('not surveyed')) return 'gray'

    // Pending - Turquoise
    if (statusLower.includes('pending')) return 'primary'

    return 'gray'
  }

  return (
    <Badge variant={getVariant(status)} size="sm" className={className} {...props}>
      {status || 'Unknown'}
    </Badge>
  )
}

export default Badge
