// Contractor Rejections Page - View and handle rejected reports

import { useState } from 'react'
import MainLayout from '../../components/Layout/MainLayout'
import { Card } from '../../components/UI'
import './Rejections.css'

const reasonLabels = {
  incomplete_data: 'بيانات غير مكتملة',
  quality_issues: 'مشاكل في الجودة',
  safety_concerns: 'مخاوف تتعلق بالسلامة',
  documentation_missing: 'وثائق ناقصة',
  technical_issues: 'مشاكل تقنية',
  other: 'أخرى',
}

const reasonIcons = {
  incomplete_data: '📝',
  quality_issues: '⚠️',
  safety_concerns: '🛡️',
  documentation_missing: '📎',
  technical_issues: '🔧',
  other: '❓',
}

const statusLabels = {
  pending_action: 'بانتظار الإجراء',
  resubmitted: 'تم إعادة التقديم',
  resolved: 'تم الحل',
}

const statusColors = {
  pending_action: 'error',
  resubmitted: 'warning',
  resolved: 'success',
}

const Rejections = () => {
  const [rejections] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredRejections =
    statusFilter === 'all'
      ? rejections
      : rejections.filter((r) => r.status === statusFilter)

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const pendingCount = rejections.filter(
    (r) => r.status === 'pending_action'
  ).length

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date()
  }

  return (
    <MainLayout>
      <div className="rejections-page" dir="rtl">
        <div className="page-header">
          <div className="page-header__info">
            <h1 className="page-title">التقارير المرفوضة</h1>
            <p className="page-subtitle">
              متابعة وإعادة تقديم التقارير المرفوضة
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="alert alert--error">
              <span className="alert__icon">⚠️</span>
              <span>{pendingCount} تقارير تحتاج إجراء فوري</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="stats-row">
          <Card className="stat-card stat-card--error">
            <div className="stat-card__content">
              <span className="stat-card__value">{pendingCount}</span>
              <span className="stat-card__label">بانتظار الإجراء</span>
            </div>
          </Card>
          <Card className="stat-card stat-card--warning">
            <div className="stat-card__content">
              <span className="stat-card__value">
                {rejections.filter((r) => r.status === 'resubmitted').length}
              </span>
              <span className="stat-card__label">تم إعادة التقديم</span>
            </div>
          </Card>
          <Card className="stat-card stat-card--success">
            <div className="stat-card__content">
              <span className="stat-card__value">
                {rejections.filter((r) => r.status === 'resolved').length}
              </span>
              <span className="stat-card__label">تم الحل</span>
            </div>
          </Card>
        </div>

        {/* Filter */}
        <Card className="filter-card">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending_action">بانتظار الإجراء</option>
            <option value="resubmitted">تم إعادة التقديم</option>
            <option value="resolved">تم الحل</option>
          </select>
        </Card>

        {/* Rejections List */}
        <div className="rejections-list">
          {filteredRejections.map((rejection) => (
            <Card
              key={rejection.id}
              className={`rejection-card ${
                rejection.status === 'pending_action' ? 'rejection-card--urgent' : ''
              }`}
            >
              <div className="rejection-card__header">
                <div className="rejection-reason">
                  <span className="rejection-reason__icon">
                    {reasonIcons[rejection.reason]}
                  </span>
                  <span className="rejection-reason__label">
                    {reasonLabels[rejection.reason]}
                  </span>
                </div>
                <span className={`status-badge status-badge--${statusColors[rejection.status]}`}>
                  {statusLabels[rejection.status]}
                </span>
              </div>

              <div className="rejection-card__site">
                <h3 className="site-name">{rejection.siteName}</h3>
                <span className="site-id">{rejection.siteId}</span>
              </div>

              <div className="rejection-card__details">
                <p className="rejection-details">{rejection.reasonDetails}</p>
              </div>

              <div className="rejection-card__meta">
                <div className="meta-item">
                  <span className="meta-label">مرفوض بواسطة:</span>
                  <span className="meta-value">{rejection.rejectedBy}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">تاريخ الرفض:</span>
                  <span className="meta-value">{formatDate(rejection.rejectedAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">الموعد النهائي:</span>
                  <span
                    className={`meta-value ${
                      isOverdue(rejection.deadline) && rejection.status === 'pending_action'
                        ? 'overdue'
                        : ''
                    }`}
                  >
                    {formatDate(rejection.deadline)}
                    {isOverdue(rejection.deadline) && rejection.status === 'pending_action' && (
                      <span className="overdue-badge">متأخر</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="rejection-card__footer">
                <span className="rejection-id">{rejection.id}</span>
                <div className="rejection-card__actions">
                  <button className="btn btn--outline btn--sm">عرض التفاصيل</button>
                  {rejection.status === 'pending_action' && (
                    <button className="btn btn--primary btn--sm">إعادة التقديم</button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredRejections.length === 0 && (
          <div className="empty-state">
            <span className="empty-state__icon">✅</span>
            <p>لا يوجد تقارير مرفوضة</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default Rejections
