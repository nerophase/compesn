import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { TTeam } from "@compesn/shared/common/schemas";

export function TeamNameInput({
	form,
	teams,
	userTeams,
	name,
	blocked = false,
	callback,
	placeholder = "Enter team name...",
	className,
}: {
	form: any;
	teams: TTeam[];
	userTeams: TTeam[];
	name: string;
	blocked?: boolean;
	callback?: (value?: any) => void;
	placeholder?: string;
	className?: string;
}) {
	const [open, setOpen] = useState<boolean>(false);
	const [searchText, setSearchText] = useState<string>("");
	const inputRef = useRef<HTMLInputElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [dropdownWidth, setDropdownWidth] = useState<number>(0);

	useLayoutEffect(() => {
		if (inputRef.current) {
			setDropdownWidth(inputRef.current.offsetWidth);
		}
	}, [inputRef.current?.offsetWidth]);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open]);

	// Filter teams based on current input value
	const filteredTeams = (searchText ? teams : userTeams).filter((team) =>
		team.name.toLowerCase().includes(searchText.toLowerCase()),
	);

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className="w-full">
					<div className="relative">
						<FormControl>
							<Input
								ref={inputRef}
								placeholder={placeholder}
								value={field.value || ""}
								onChange={(e) => {
									field.onChange(e.target.value);
									setSearchText(e.target.value);
									callback?.(e.target.value);
								}}
								onFocus={() => {
									setSearchText(field.value || "");
									setOpen(true);
								}}
								maxLength={25}
								disabled={blocked}
								className={cn("pr-10", className)}
							/>
						</FormControl>

						{/* Dropdown trigger button */}
						<Button
							ref={buttonRef}
							type="button"
							variant="ghost"
							size="sm"
							className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
							disabled={blocked}
							onClick={() => {
								setSearchText(field.value || "");
								setOpen(!open);
							}}
						>
							<ChevronsUpDown className="h-4 w-4 opacity-50" />
						</Button>

						{/* Dropdown positioned relative to input */}
						{open && (
							<div
								ref={dropdownRef}
								className="absolute top-full left-0 z-50 mt-1"
								style={{ width: dropdownWidth }}
							>
								<div className="bg-popover text-popover-foreground rounded-md border shadow-md p-0">
									<Command>
										<CommandInput
											placeholder="Search teams..."
											value={searchText}
											onValueChange={(value) => {
												setSearchText(value);
												field.onChange(value);
												callback?.(value);
											}}
											disabled={blocked}
										/>
										<CommandList>
											{filteredTeams.length === 0 ? (
												<CommandEmpty>
													{searchText
														? `Create "${searchText}"`
														: "No teams found."}
												</CommandEmpty>
											) : (
												<CommandGroup>
													{filteredTeams.map((team) => (
														<CommandItem
															value={team.name}
															key={team.name}
															onSelect={() => {
																field.onChange(team.name);
																setOpen(false);
																callback?.(team.name);
															}}
														>
															{team.name}
															<Check
																className={cn(
																	"ml-auto h-4 w-4",
																	team.name === field.value
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
														</CommandItem>
													))}
												</CommandGroup>
											)}
										</CommandList>
									</Command>
								</div>
							</div>
						)}
					</div>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
