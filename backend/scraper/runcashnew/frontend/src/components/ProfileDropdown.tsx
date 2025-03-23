import React from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, User, UserCog, CreditCard, Wallet, LogOut, Lock, Mail, Edit, CreditCard as PlanCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Sessão encerrada",
      description: "Você foi desconectado com sucesso.",
    });
    navigate('/auth');
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="h-8 w-8 border border-vegas-darkgray">
              <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} alt="@user" />
              <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-white font-medium">{user?.user_metadata?.name || user?.email?.split('@')[0] || "Usuário"}</span>
              <span className="text-[10px] text-gray-400">{user?.email}</span>
            </div>
            <ChevronDown size={12} className="text-gray-400" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-vegas-darkgray border-vegas-black text-white">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          
          {/* Editar perfil */}
          <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2 focus:bg-[#262626] focus:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditProfileOpen(true);
                }}
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <User size={16} />
                <span>Editar Perfil</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-vegas-darkgray text-white border-vegas-black">
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Edite as informações do seu perfil
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="name">Nome</label>
                  <Input id="name" placeholder="Seu nome" defaultValue={user?.user_metadata?.name || ""} className="bg-[#262626] border-gray-700 text-white" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="email">Email</label>
                  <Input id="email" type="email" placeholder="seu@email.com" defaultValue={user?.email || ""} className="bg-[#262626] border-gray-700 text-white" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  setIsEditProfileOpen(false);
                  toast({
                    title: "Perfil atualizado",
                    description: "Suas informações foram atualizadas com sucesso.",
                  });
                }}>Salvar Alterações</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Senha */}
          <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2 focus:bg-[#262626] focus:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  setIsPasswordOpen(true);
                }}
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <Lock size={16} />
                <span>Alterar Senha</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-vegas-darkgray text-white border-vegas-black">
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Escolha uma nova senha segura
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="current-password">Senha Atual</label>
                  <Input id="current-password" type="password" className="bg-[#262626] border-gray-700 text-white" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="new-password">Nova Senha</label>
                  <Input id="new-password" type="password" className="bg-[#262626] border-gray-700 text-white" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="confirm-password">Confirmar Nova Senha</label>
                  <Input id="confirm-password" type="password" className="bg-[#262626] border-gray-700 text-white" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  setIsPasswordOpen(false);
                  toast({
                    title: "Senha alterada",
                    description: "Sua senha foi alterada com sucesso.",
                  });
                }}>Salvar Nova Senha</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Planos e Assinaturas */}
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2 focus:bg-[#262626] focus:text-white"
            onClick={() => navigate('/planos')}
          >
            <PlanCard size={16} />
            <span>Planos e Assinaturas</span>
          </DropdownMenuItem>
          
          {/* Configurações */}
          <DropdownMenuItem className="cursor-pointer flex items-center gap-2 focus:bg-[#262626] focus:text-white">
            <UserCog size={16} />
            <span>Configurações</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          {/* Depositar */}
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2 focus:bg-[#262626] focus:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDepositOpen(true);
                }}
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <CreditCard size={16} />
                <span>Depositar</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-vegas-darkgray text-white border-vegas-black">
              <DialogHeader>
                <DialogTitle>Depositar Fundos</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Adicione saldo à sua conta para jogar
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="amount">Valor</label>
                  <Input id="amount" type="number" placeholder="0.00" min="10" step="10" className="bg-[#262626] border-gray-700 text-white" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="payment-method">Método de Pagamento</label>
                  <select id="payment-method" className="flex h-10 w-full rounded-md border border-gray-700 bg-[#262626] px-3 py-2 text-sm text-white">
                    <option value="pix">PIX</option>
                    <option value="credit-card">Cartão de Crédito</option>
                    <option value="bank-transfer">Transferência Bancária</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  setIsDepositOpen(false);
                  toast({
                    title: "Depósito em processamento",
                    description: "Seu depósito está sendo processado e será creditado em breve.",
                  });
                }}>Confirmar Depósito</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Sacar */}
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2 focus:bg-[#262626] focus:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  setIsWithdrawOpen(true);
                }}
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <Wallet size={16} />
                <span>Sacar</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-vegas-darkgray text-white border-vegas-black">
              <DialogHeader>
                <DialogTitle>Sacar Fundos</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Retire seus ganhos para sua conta bancária
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="withdraw-amount">Valor</label>
                  <Input id="withdraw-amount" type="number" placeholder="0.00" min="10" step="10" className="bg-[#262626] border-gray-700 text-white" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="withdraw-method">Método de Saque</label>
                  <select id="withdraw-method" className="flex h-10 w-full rounded-md border border-gray-700 bg-[#262626] px-3 py-2 text-sm text-white">
                    <option value="pix">PIX</option>
                    <option value="bank-account">Conta Bancária</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-2">
                  <label htmlFor="pix-key">Chave PIX</label>
                  <Input id="pix-key" placeholder="Sua chave PIX" className="bg-[#262626] border-gray-700 text-white" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  setIsWithdrawOpen(false);
                  toast({
                    title: "Saque solicitado",
                    description: "Seu saque foi solicitado e será processado em até 24 horas.",
                  });
                }}>Confirmar Saque</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2 text-red-500 focus:bg-[#262626] focus:text-red-500"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="h-8 w-8 bg-vegas-green/20 rounded-full flex items-center justify-center ml-1">
        <span className="text-vegas-green font-bold text-xs">3</span>
      </div>
    </div>
  );
};

export default ProfileDropdown;
