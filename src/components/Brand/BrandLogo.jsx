import React from 'react';
// import Logo3D from '../Logo3D';
import logoNew from '../../assets/images/logo-new.png';
import './BrandLogo.css';

/**
 * BrandLogo Component
 * Displays the e-YAS SITES brand with new 2D logo
 *
 * @param {string} variant - 'login' | 'header' | 'sidebar' | 'minimal'
 * @param {string} className - Additional CSS classes
 */
const BrandLogo = ({ variant = 'header', className = '' }) => {
  // Get logo size based on variant
  const getLogoSize = () => {
    switch (variant) {
      case 'login': return { width: 180, height: 'auto' };
      case 'header': return { width: 60, height: 'auto' };
      case 'sidebar': return { width: 50, height: 'auto' };
      case 'minimal': return { width: 50, height: 'auto' };
      default: return { width: 60, height: 'auto' };
    }
  };

  const dimensions = getLogoSize();

  // Brand name with colored segments
  const BrandName = () => (
    <div className="brand-name">
      <span className="brand-name__prefix">e-</span>
      <span className="brand-name__yas">YAS </span>
      <span className="brand-name__sites">SITES</span>
    </div>
  );

  // Tagline component
  const Tagline = () => (
    <p className="brand-tagline">Enhance Your AI System</p>
  );

  // Divider line with gradient
  const Divider = () => <div className="brand-divider" />;

  // Footer component for login variant
  const Footer = () => (
    <p className="brand-footer">
      <span className="brand-footer__enhanced">Enhanced by YAS</span>
      <span className="brand-footer__separator">  ||  </span>
      <span className="brand-footer__powered">Powered By: YAS MCPs</span>
    </p>
  );

  // Render based on variant
  const renderVariant = () => {
    switch (variant) {
      case 'login':
        return (
          <div className={`brand-logo brand-logo--login ${className}`}>
            <img 
              src={logoNew} 
              alt="e-YAS Logo" 
              style={{ width: dimensions.width, height: dimensions.height, borderRadius: '16px', objectFit: 'contain' }} 
            />
            {/* <Logo3D size={120} /> */}
            <BrandName />
            <Tagline />
            <Divider />
            <Footer />
          </div>
        );

      case 'header':
        return (
          <div className={`brand-logo brand-logo--header ${className}`}>
            <img 
              src={logoNew} 
              alt="e-YAS Logo" 
              style={{ width: dimensions.width, height: dimensions.height, borderRadius: '12px', objectFit: 'contain' }} 
            />
            <BrandName />
            <Tagline />
          </div>
        );

      case 'sidebar':
        return (
          <div className={`brand-logo brand-logo--sidebar ${className}`}>
             <img 
              src={logoNew} 
              alt="e-YAS Logo" 
              style={{ width: dimensions.width, height: dimensions.height, borderRadius: '8px', objectFit: 'contain' }} 
            />
            <div className="brand-sidebar-content">
              <BrandName />
            </div>
          </div>
        );

      case 'minimal':
        return (
          <div className={`brand-logo brand-logo--minimal ${className}`}>
            <img 
              src={logoNew} 
              alt="e-YAS Logo" 
              style={{ width: dimensions.width, height: dimensions.height, borderRadius: '8px', objectFit: 'contain' }} 
            />
          </div>
        );

      default:
        return (
          <div className={`brand-logo brand-logo--header ${className}`}>
            <img 
              src={logoNew} 
              alt="e-YAS Logo" 
              style={{ width: dimensions.width, height: dimensions.height, borderRadius: '12px', objectFit: 'contain' }} 
            />
            <BrandName />
          </div>
        );
    }
  };

  return renderVariant();
};

export default BrandLogo;
