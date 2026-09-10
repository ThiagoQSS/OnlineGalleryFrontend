"use client";

import React, { Suspense } from "react";
import InvitePage from "./[token]/page";
import * as Icon from "lucide-react";

export default function ConviteQueryPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background2 flex items-center justify-center text-xs text-foreground2 gap-2">
					<Icon.Loader2 className="w-4 h-4 animate-spin" />
					<span>Carregando convite...</span>
				</div>
			}
		>
			<InvitePage />
		</Suspense>
	);
}
