"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DraftExpiredModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function DraftExpiredModal({ isOpen, onClose }: DraftExpiredModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
							<AlertTriangle className="w-6 h-6 text-red-600" />
						</div>
						<div>
							<DialogTitle className="text-red-600">Draft Expired</DialogTitle>
							<DialogDescription>
								The draft session has expired due to inactivity.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="py-4">
					<p className="text-sm text-muted-foreground">
						This draft was automatically cancelled because it exceeded the time limit.
						You can return to the scrims page to schedule a new match.
					</p>
				</div>

				<DialogFooter>
					<Button onClick={onClose} className="w-full">
						Back to Scrims
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
