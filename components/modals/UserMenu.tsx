import { useAuth } from "@/hooks/useAuth";
import * as Icon from "lucide-react";
import React from "react";

type UserMenuProps = {
	visible: boolean;
	setVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const UserMenu = ({ visible, setVisible }: UserMenuProps) => {
	const { user, logout } = useAuth();

	if (!visible) return null;

	return (
		<div className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-2 shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
			<div className="px-3 py-2 border-b border-gray-100">
				<p className="text-sm font-semibold text-gray-900 truncate">
					{user?.nome || "Usuário"}
				</p>
				<p className="text-xs text-gray-500 truncate">
					{user?.email || "usuario@email.com"}
				</p>
			</div>

			<div className="py-1">
				<button
					onClick={() => {
						setVisible(false);
						// Aqui você pode colocar navegação para configurações/perfil no futuro
					}}
					className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
				>
					<Icon.User className="w-4 h-4" /> Minha Conta
				</button>
			</div>

			<div className="pt-1 border-t border-gray-100">
				<button
					onClick={async () => {
						setVisible(false);
						await logout();
					}}
					className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
				>
					<Icon.LogOut className="w-4 h-4" /> Sair da conta
				</button>
			</div>
		</div>
	);
};

export default UserMenu;
