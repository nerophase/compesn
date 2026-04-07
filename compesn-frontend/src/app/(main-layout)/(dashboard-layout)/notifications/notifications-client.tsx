"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Mail, Users, Calendar } from "lucide-react";
import DashboardHeader from "@/components/dashboard-top";
import { socket } from "@/lib/sockets";

interface NotificationsClientProps {
	userId: string;
}

export default function NotificationsClient({ userId }: NotificationsClientProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Fetch user invites
	const { data: invites = [], isLoading } = useQuery(trpc.teams.userInvites.queryOptions());

	// Respond to invite mutation
	const respondToInviteMutation = useMutation(
		trpc.teams.respondToInvite.mutationOptions({
			onSuccess: (data, variables) => {
				queryClient.invalidateQueries(trpc.teams.userInvites.queryOptions());
				queryClient.invalidateQueries({ queryKey: [["teams", "list"]] });
				queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				if (variables.response === "ACCEPT") {
					toast.success("Invite accepted! You've joined the team.");
				} else {
					toast.success("Invite declined.");
				}
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const handleAcceptInvite = (inviteId: string) => {
		respondToInviteMutation.mutate({
			inviteId,
			response: "ACCEPT",
		});
	};

	const handleDeclineInvite = (inviteId: string) => {
		respondToInviteMutation.mutate({
			inviteId,
			response: "DECLINE",
		});
	};

	useEffect(() => {
		const joinNotificationsRoom = () => {
			socket.emit("notifications:join", userId);
		};

		const handleNewNotification = () => {
			void queryClient.invalidateQueries(trpc.teams.userInvites.queryOptions());
		};

		if (!socket.connected) {
			socket.connect();
		}

		joinNotificationsRoom();
		socket.on("connect", joinNotificationsRoom);
		socket.on("notifications:new", handleNewNotification);

		return () => {
			socket.off("connect", joinNotificationsRoom);
			socket.off("notifications:new", handleNewNotification);
		};
	}, [queryClient, trpc, userId]);

	const getRoleColor = (role: string) => {
		const colors = {
			TOP: "bg-blue-100 text-blue-800",
			JUNGLE: "bg-green-100 text-green-800",
			MID: "bg-yellow-100 text-yellow-800",
			BOT: "bg-red-100 text-red-800",
			SUPPORT: "bg-purple-100 text-purple-800",
			SUB: "bg-gray-100 text-gray-800",
			COACH: "bg-orange-100 text-orange-800",
		};
		return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<DashboardHeader
				title="Notifications"
				description="View and respond to your team invitations."
			/>

			<div className="space-y-6">
				{/* Team Invites Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5" />
							Team Invitations ({invites.length})
						</CardTitle>
						<CardDescription>Pending invitations to join teams</CardDescription>
					</CardHeader>
					<CardContent>
						{invites.length === 0 ? (
							<div className="text-center py-8">
								<Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium mb-2">No pending invitations</h3>
								<p className="text-muted-foreground">
									You don&apos;t have any team invitations at the moment.
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{invites.map((invite) => (
									<div
										key={invite.id}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex items-center gap-4">
											<Avatar>
												<AvatarImage src={invite.inviter.image || ""} />
												<AvatarFallback>
													{invite.inviter.name?.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium">
														{invite.team.name}
													</span>
													<Badge variant="outline">
														{invite.team.tag}
													</Badge>
													<Badge className={getRoleColor(invite.role)}>
														{invite.role}
													</Badge>
												</div>
												<div className="text-sm text-muted-foreground">
													<div className="flex items-center gap-4">
														<span>
															Invited by {invite.inviter.name}
														</span>
														<span className="flex items-center gap-1">
															<Calendar className="w-3 h-3" />
															Expires:{" "}
															{new Date(
																invite.expiresAt,
															).toLocaleDateString()}
														</span>
													</div>
												</div>
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												onClick={() => handleAcceptInvite(invite.id)}
												disabled={respondToInviteMutation.isPending}
											>
												<Check className="w-4 h-4 mr-1" />
												Accept
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleDeclineInvite(invite.id)}
												disabled={respondToInviteMutation.isPending}
											>
												<X className="w-4 h-4 mr-1" />
												Decline
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Future: Other notification types can be added here */}
			</div>
		</div>
	);
}
