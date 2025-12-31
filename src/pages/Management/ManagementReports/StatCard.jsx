/**
 * StatCard Component
 * Quick stat display card for reports
 */

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="stat-card-report" style={{ borderLeftColor: color }}>
    <div className="stat-card-icon" style={{ backgroundColor: `${color}20` }}>
      {icon}
    </div>
    <div className="stat-card-content">
      <div className="stat-card-value" style={{ color }}>{value.toLocaleString()}</div>
      <div className="stat-card-title">{title}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  </div>
)

export default StatCard
