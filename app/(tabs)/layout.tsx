"use client";
import { usePathname } from "next/navigation";
import { Url } from "next/dist/shared/lib/router/router";
import Link from "next/link";
import * as Icon from "lucide-react";
import { useState } from "react";
import UserMenu from "@/components/modals/UserMenu";

export default function TabsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [userModalOpen, setUserModalOpen] = useState<boolean>(false);

	return (
		<div className="flex min-h-screen flex-col">
			<header className="p-4 w-full flex flex-row justify-between">
				<h1 className="text-3xl">Online Gallery</h1>

				<div className="relative">
					<div
						className="flex rounded-full bg-surface1 p-2 aspect-square w-10 h-10 items-center justify-center"
						onClick={() => setUserModalOpen((prev) => !prev)}
					>
						<Icon.User />
					</div>

					{userModalOpen && (
						<div className="fixed inset-0 z-50 flex justify-end p-2">
							<div
								className="fixed inset-0 bg-black/40 transition-opacity"
								onClickCapture={(e) => {
									e.stopPropagation();
									e.preventDefault();
									setUserModalOpen(false);
								}}
							/>
							<div className="relative right-12 top-0 mr-2 z-50 min-w-50">
								<UserMenu
									visible={userModalOpen}
									setVisible={setUserModalOpen}
								/>
							</div>
						</div>
					)}
				</div>
			</header>

			<div className="flex flex-1">
				<aside className="w-52 pl-2 pr-2">
					<nav className="flex flex-col gap-1 ">
						<SideNavigationCard href="/photos">
							<Icon.ImageIcon /> Photos
						</SideNavigationCard>

						<SideNavigationCard href="/albuns">
							<Icon.Album /> Albums
						</SideNavigationCard>

						<SideNavigationCard href="/trash">
							<Icon.Trash2 /> Trash
						</SideNavigationCard>
					</nav>
				</aside>

				<main className="flex-1 bg-background2 rounded-3xl p-4 mr-4 ml-4 mb-4">
					{children}
				</main>
			</div>
		</div>
	);
}

interface SideNavigationCardProps {
	href: Url;
	children: React.ReactNode;
}

const SideNavigationCard = ({ href, children }: SideNavigationCardProps) => {
	const pathname = usePathname();
	// Converte o href para string para garantir a comparação correta
	const hrefString = typeof href === "object" ? (href.pathname ?? "") : href;
	// Verifica se a rota atual é igual ao href do link
	const isActive = pathname === hrefString;

	return (
		<Link
			href={href}
			className={`rounded-4xl pl-5 pr-5 pt-3 pb-3 font-bold flex flex-row gap-4 text-foreground2 text-xs items-center
    ${isActive ? "bg-selected-surface text-selected-surface2 hover:bg-selected-surface hover:text-selected-surface2" : "text-foreground2 hover:bg-surface1 hover:text-foreground"}`}
		>
			{children}
		</Link>
	);
};
