import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLayoutEffect, useRef, useState } from "react";
import { TUserTeam } from "@compesn/shared/types/user-team";
import type { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";

type ComboboxOption<TValue extends string = string> = {
	label: string;
	value: TValue;
};

type FormComboboxProps<TFormValues extends FieldValues, TValue extends string> = {
	form: UseFormReturn<TFormValues>;
	options: ComboboxOption<TValue>[];
	name: Path<TFormValues>;
	label: string;
	width?: number;
	canSearch?: boolean;
	blocked?: boolean;
	orientation?: "horizontal" | "vertical";
	callback?: (value: TValue) => void;
};

export function FormCombobox<TFormValues extends FieldValues, TValue extends string>({
	form,
	options,
	name,
	label,
	width,
	canSearch = false,
	blocked = false,
	orientation = "horizontal",
	callback,
}: FormComboboxProps<TFormValues, TValue>) {
	const [open, setOpen] = useState<boolean>(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [dropdownWidth, setDropdownWidth] = useState<number>(0);

	useLayoutEffect(() => {
		if (buttonRef.current) {
			setDropdownWidth(buttonRef.current.clientWidth);
		}
	}, []);

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem
					className={cn(
						"flex gap-2 w-fit",
						orientation === "vertical"
							? "flex-col items-start"
							: "flex-row items-center",
						!width && "w-full",
					)}
				>
					{!blocked ? (
						<FormLabel className="text-lg">{label}</FormLabel>
					) : (
						<span className="text-lg hover:cursor-default">{label}</span>
					)}
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									variant="outline"
									role="combobox"
									style={{ width }}
									className={cn(
										`justify-between`,
										!field.value && "text-muted-foreground",
										!width && "w-full",
									)}
									disabled={blocked}
									ref={buttonRef}
								>
									{field.value
										? options.find((option) => option.value === field.value)?.label
										: `Select ${label}`}
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</FormControl>
						</PopoverTrigger>
						<PopoverContent className="p-0" style={{ width: dropdownWidth }}>
							<Command>
								{canSearch && <CommandInput placeholder="Search..." />}
								<CommandList>
									<CommandEmpty>No {label} found.</CommandEmpty>
									<CommandGroup>
										{options.map((option) => (
											<CommandItem
												value={option.label}
												key={option.value}
												onSelect={() => {
													form.setValue(
														name,
														option.value as PathValue<TFormValues, Path<TFormValues>>,
													);
													setOpen(false);
													callback?.(option.value);
												}}
												className="cursor-pointer"
											>
												{option.label}
												<Check
													className={cn(
														"ml-auto",
														option.value === field.value
															? "opacity-100"
															: "opacity-0",
													)}
												/>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function FormTeamNameCombobox({
	form,
	teams,
	userTeams,
	name,
	blocked = false,
	callback,
}: {
	form: UseFormReturn<FieldValues>;
	teams: TUserTeam[];
	userTeams: TUserTeam[];
	name: string;
	blocked?: boolean;
	callback?: (value?: string) => void;
}) {
	const [open, setOpen] = useState<boolean>(false);
	const selectInputRef = useRef<HTMLButtonElement>(null);
	const [dropdownWidth, setDropdownWidth] = useState<number>(0);
	const [searchText, setSearchText] = useState<string>("");

	useLayoutEffect(() => {
		if (selectInputRef.current) setDropdownWidth(selectInputRef.current.clientWidth);
	}, [selectInputRef.current?.clientWidth]);

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex items-center gap-2 w-full">
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									variant="outline"
									role="combobox"
									ref={selectInputRef}
									className={cn(
										`justify-between w-full`,
										!field.value && "text-muted-foreground",
									)}
									disabled={blocked}
								>
									{field.value
										? teams.find((team) => team.name === field.value)?.name
										: `Select Team`}
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</FormControl>
						</PopoverTrigger>
						<PopoverContent className={`p-0`} style={{ width: dropdownWidth }}>
							<Command>
								<CommandInput
									placeholder="Search Team..."
									value={searchText}
									onValueChange={setSearchText}
									disabled={blocked}
								/>
								<CommandList>
									<CommandEmpty>No team found.</CommandEmpty>
									<CommandGroup>
										{(searchText ? teams : userTeams).map((team) => (
											<CommandItem
												value={team.name}
												key={team.name}
												onSelect={() => {
													form.setValue(name, team.name);
													setOpen(false);
													callback?.(team.name);
												}}
											>
												{team.name}
												<Check
													className={cn(
														"ml-auto",
														team.name === field.value
															? "opacity-100"
															: "opacity-0",
													)}
												/>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
