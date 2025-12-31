import './Card.css'

const Card = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const classNames = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    onClick && 'card-clickable',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classNames} onClick={onClick} {...props}>
      {(title || icon) && (
        <div className="card-header">
          {icon && <div className="card-icon">{icon}</div>}
          <div className="card-header-text">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  )
}

export default Card
