import logoNew from '../../../../assets/images/logo-new.png';

const SettingsFooter = () => {
  return (
    <footer className="settings-footer">
      <div className="footer-content" style={{
        padding: '1rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(148,163,184,0.1)',
        marginTop: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <img src={logoNew} alt="Logo" style={{ width: '28px', height: '28px' }} onError={(e) => e.target.style.display = 'none'} />
          <span style={{ 
            fontWeight: '700', 
            fontSize: '1rem',
            background: 'linear-gradient(90deg, #8FD9D9, #FF8566)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            e-YAS SITES
          </span>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>v1.0.0</span>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
          color: '#94a3b8'
        }}>
          <span>By Aysar M. Otoum</span>
          <a href="tel:0777889870" style={{ color: '#818cf8', textDecoration: 'none' }}>📞 0777889870</a>
          <a href="https://wa.me/962799889870" target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', textDecoration: 'none' }}>
            💬 WhatsApp
          </a>
        </div>

        <p style={{ color: '#475569', fontSize: '0.7rem', margin: '0.5rem 0 0' }}>
          &copy; {new Date().getFullYear()} YAS Systems
        </p>
      </div>
    </footer>
  )
}

export default SettingsFooter
