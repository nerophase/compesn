"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { TChampion } from "@compesn/shared/common/types/champion";
import SearchBar from "@/components/search-bar";
import ChampionFilters from "@/components/champion-filters";
import Image from "next/image";
import { TRole } from "@compesn/shared/common/types/role";
import CheckboxInput from "@/components/checkbox-input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ROLES } from "@/constants/roles";
import { getChampionSmallImgURL } from "@/lib/utils";
import DashboardHeader from "@/components/dashboard-top";
import { CHAMPIONS } from "@/constants/champions-db/champions-data";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

export default function ManageChampionsPage() {
	const trpc = useTRPC();

	const [championsList, setChampionsList] = useState<TChampion[]>([]);
	const [search, setSearch] = useState<string>("");
	const [activeFilters, setActiveFilters]: [any[], any] = useState([]);
	const [loadingUpdate, setLoadingUpdate] = useState<boolean>(false);
	const [rolesDialogOpen, setRolesDialogOpen] = useState<boolean>(false);
	const [selectedChampion, setSelectedChampion] = useState<TChampion>();
	const [selectedChampionRoles, setSelectedChampionRoles] = useState<TRole[]>();
	const [loadingChampionRole, setLoadingChampionRole] = useState<boolean>(false);

	const { mutateAsync: updateAllChampions } = useMutation(
		trpc.champions.updateAll.mutationOptions(),
	);
	const { mutateAsync: updateChampion } = useMutation(trpc.champions.update.mutationOptions());

	useEffect(() => {
		setChampionsList(
			CHAMPIONS.filter((champion) => {
				let haveRoles = true;
				activeFilters.forEach((activeFilter) => {
					if (activeFilter === "no-role" && champion.roles.length === 0) {
						haveRoles = true;
						return;
					}
					if (!champion.roles.includes(activeFilter)) {
						haveRoles = false;
					}
				});

				return champion.name.toLowerCase().includes(search.toLowerCase()) && haveRoles;
			}),
		);
	}, [search, activeFilters]);

	return (
		<div className="w-full">
			<DashboardHeader title="Champions" description="Update champions and manage it's roles">
				<Button
					disabled={loadingUpdate}
					onClick={async () => {
						setLoadingUpdate(true);

						const response = await updateAllChampions();

						if (response.length !== 0) {
							toast("Succesfully updated champions!");
						} else {
							toast("There are no new champions.");
						}

						setLoadingUpdate(false);
					}}
				>
					Update Champions
				</Button>
			</DashboardHeader>
			<div className="w-full flex mb-2">
				<SearchBar search={search} setSearch={setSearch} draftMode={false} />
				<ChampionFilters
					activeFilters={activeFilters}
					setActiveFilters={setActiveFilters}
					activeColor={"drop-shadow-[0px_0px_5px_#5A41F6]"}
					showNoRole
				/>
			</div>
			<Table>
				<TableHeader>
					<TableRow className="bg-primary">
						<TableHead className="w-0">Champion</TableHead>
						<TableHead>Roles</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{championsList.map((champion) => (
						<TableRow
							className="hover:cursor-pointer hover:bg-primary/60"
							onClick={() => {
								setRolesDialogOpen(true);
								setSelectedChampion(champion);
								setSelectedChampionRoles(champion.roles);
							}}
							key={champion.fileName}
						>
							<TableCell className="font-medium">{champion.name}</TableCell>
							<TableCell>
								{champion.roles.map((role) => (
									<span key={role}>{role} </span>
								))}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
				<DialogTitle></DialogTitle>
				<DialogContent className="max-w-sm flex flex-col gap-2">
					<div className="flex items-start gap-4 mb-2">
						{selectedChampion && (
							<Image
								src={getChampionSmallImgURL(selectedChampion)}
								alt={`${selectedChampion?.name} image`}
								width={92}
								height={92}
							/>
						)}
						<span className="text-xl">{selectedChampion?.name}</span>
					</div>
					<div className="flex gap-4 flex-wrap mb-4">
						{ROLES.map((role) => (
							<CheckboxInput
								key={role}
								id={role}
								blocked={false}
								label={role[0].toLocaleUpperCase() + role.slice(1)}
								onChange={() => {
									if (selectedChampionRoles?.includes(role)) {
										setSelectedChampionRoles(
											selectedChampionRoles.filter((e) => e !== role),
										);
									} else {
										setSelectedChampionRoles([...selectedChampionRoles!, role]);
									}
								}}
								value={selectedChampionRoles?.includes(role) || false}
							/>
						))}
					</div>
					<Button
						disabled={loadingChampionRole}
						onClick={async () => {
							setLoadingChampionRole(true);

							if (!selectedChampion || !selectedChampionRoles) return;

							const response = await updateChampion({
								championFileName: selectedChampion.fileName,
								champion: {
									...selectedChampion,
									roles: selectedChampionRoles,
								},
							});

							if (response) {
								// update the champions list (use tanstack query)

								toast("Succesfully updated champion role.");

								setRolesDialogOpen(false);
							} else {
								toast("Some error has ocurred.");
							}

							setLoadingChampionRole(false);
						}}
					>
						Save
					</Button>
				</DialogContent>
			</Dialog>
		</div>
	);
}
