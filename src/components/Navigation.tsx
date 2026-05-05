import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Button from './Button';
import RegisterModal from './RegisterModal';
import { useStore } from '../store/useStore';
import { authService } from '../services/authService';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useStore();

  const isB2B = location.pathname.startsWith('/unternehmen');

  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    const user = await authService.getCurrentUser();
    if (user) {
      setUser({ email: user.email || '', name: user.user_metadata?.full_name });
    }
    navigate(isB2B ? '/unternehmen/dashboard' : '/dashboard');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg bg-opacity-95 backdrop-blur-sm border-b border-white border-opacity-10">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={isB2B ? '/unternehmen' : '/'} className="flex items-center gap-3">
            <img src="/DYD Logo.jpg" alt="DYD Logo" className="h-10 w-10 rounded-lg" />
            <span className="text-2xl font-bold">DYD</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-text-secondary hover:text-white transition-colors">
              {isB2B ? 'Features' : 'So funktioniert\'s'}
            </a>
            <a href="#pricing" className="text-text-secondary hover:text-white transition-colors">
              Preis
            </a>
            <Link to="/faq" className="text-text-secondary hover:text-white transition-colors">
              FAQ
            </Link>
            <Link to="/festival" className="text-text-secondary hover:text-white transition-colors">
              Festival
            </Link>
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-text-secondary hover:text-white transition-colors"
            >
              Login
            </button>
            <Button onClick={() => window.location.href = isB2B ? '/unternehmen/dashboard' : '/service-selection'}>
              {isB2B ? 'Demo vereinbaren' : 'Kostenlos testen'}
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-card border-t border-white border-opacity-10">
          <div className="px-4 py-4 space-y-4">
            <a href="#how-it-works" className="block text-text-secondary hover:text-white transition-colors">
              {isB2B ? 'Features' : 'So funktioniert\'s'}
            </a>
            <a href="#pricing" className="block text-text-secondary hover:text-white transition-colors">
              Preis
            </a>
            <Link
              to="/faq"
              className="block text-text-secondary hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              to="/festival"
              className="block text-text-secondary hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Festival
            </Link>
            <button
              onClick={() => {
                setShowLoginModal(true);
                setMobileMenuOpen(false);
              }}
              className="block text-text-secondary hover:text-white transition-colors w-full text-left"
            >
              Login
            </button>
            <Button className="w-full" onClick={() => window.location.href = isB2B ? '/unternehmen/dashboard' : '/service-selection'}>
              {isB2B ? 'Demo vereinbaren' : 'Kostenlos testen'}
            </Button>
          </div>
        </div>
      )}

      <RegisterModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        prefilledEmail=""
        initialMode="login"
      />
    </nav>
  );
}
