import './Button.css'

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  isLoading, // Destructure to preventing passing to DOM, use as alias for loading
  ...props
}) => {
  const isLoadingActive = loading || isLoading
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full',
    isLoadingActive && 'btn-loading',
    disabled && 'btn-disabled',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled || isLoadingActive}
      {...props}
    >
      {isLoadingActive ? (
        <span className="btn-spinner"></span>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
          {children && <span className="btn-text">{children}</span>}
          {icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
        </>
      )}
    </button>
  )
}

export default Button
