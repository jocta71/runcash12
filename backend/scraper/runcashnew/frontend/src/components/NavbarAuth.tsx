
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LogOut, LogIn } from 'lucide-react';

const NavbarAuth = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm hidden md:inline-block">
          {user.email?.split('@')[0]}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          className="text-xs sm:text-sm"
        >
          <LogOut className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      asChild
      className="text-xs sm:text-sm"
    >
      <Link to="/auth">
        <LogIn className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Login</span>
      </Link>
    </Button>
  );
};

export default NavbarAuth;
