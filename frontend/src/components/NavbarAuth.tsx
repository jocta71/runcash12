import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

// Versão mock do NavbarAuth que não usa autenticação
const NavbarAuth = () => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      asChild
      className="text-xs sm:text-sm"
    >
      <Link to="/">
        <LogIn className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Início</span>
      </Link>
    </Button>
  );
};

export default NavbarAuth;
