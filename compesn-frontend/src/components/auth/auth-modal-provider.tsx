"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import LoginPanel from "@/components/auth/login-panel";

interface AuthModalState {
	open: boolean;
	callbackUrl: string;
	error: string | null;
}

interface AuthModalContextValue {
	closeAuthModal: () => void;
	openAuthModal: (options?: { callbackUrl?: string; error?: string | null }) => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [state, setState] = useState<AuthModalState>({
		open: false,
		callbackUrl: "/",
		error: null,
	});

	const closeAuthModal = useCallback(() => {
		setState((current) => ({ ...current, open: false }));
	}, []);

	const openAuthModal = useCallback(
		(options?: { callbackUrl?: string; error?: string | null }) => {
			setState({
				open: true,
				callbackUrl: options?.callbackUrl || pathname || "/",
				error: options?.error || null,
			});
		},
		[pathname],
	);

	const value = useMemo(
		() => ({
			closeAuthModal,
			openAuthModal,
		}),
		[closeAuthModal, openAuthModal],
	);

	return (
		<AuthModalContext.Provider value={value}>
			{children}
			<Dialog open={state.open} onOpenChange={(open) => !open && closeAuthModal()}>
				<DialogContent
					showCloseButton
					overlayClassName="bg-slate-950/72 backdrop-blur-sm"
					className="border-none bg-transparent p-0 shadow-none sm:max-w-md"
				>
					<DialogHeader className="sr-only">
						<DialogTitle>Login</DialogTitle>
						<DialogDescription>Open the login modal.</DialogDescription>
					</DialogHeader>
					<LoginPanel callbackUrl={state.callbackUrl} error={state.error} />
				</DialogContent>
			</Dialog>
		</AuthModalContext.Provider>
	);
}

export function useAuthModal() {
	const context = useContext(AuthModalContext);

	if (!context) {
		throw new Error("useAuthModal must be used within an AuthModalProvider");
	}

	return context;
}
