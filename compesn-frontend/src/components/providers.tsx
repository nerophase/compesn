"use client";

import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { NotificationToastListener } from "@/components/notification-toast-listener";
import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/client";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<TRPCReactProvider>
				<AuthModalProvider>
					<NotificationToastListener />
					{children}
				</AuthModalProvider>
			</TRPCReactProvider>
		</SessionProvider>
	);
}
