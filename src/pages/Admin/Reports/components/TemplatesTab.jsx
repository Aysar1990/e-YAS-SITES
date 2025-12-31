/**
 * Reports Templates Tab Component
 */

import { Card } from '../../../../components/UI'
import { REPORT_TEMPLATES } from '../config'

const TemplatesTab = ({ applyTemplate, quickExportTemplate, exporting }) => {
  return (
    <div className="templates-content">
      <div className="templates-grid">
        {REPORT_TEMPLATES.map(template => (
          <Card key={template.id} className="template-card">
            <div className="template-icon">{template.icon}</div>
            <h3 className="template-name">{template.name}</h3>
            <p className="template-desc">{template.description}</p>
            <div className="template-columns">
              Columns: {template.columns.slice(0, 3).join(', ')}{template.columns.length > 3 ? '...' : ''}
            </div>
            <div className="template-actions">
              <button
                className="btn-customize"
                onClick={() => applyTemplate(template)}
              >
                Customize
              </button>
              <button
                className="btn-quick-export"
                onClick={() => quickExportTemplate(template)}
                disabled={exporting}
              >
                Quick Export
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TemplatesTab
