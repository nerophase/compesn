import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

type PasswordInputProps<TFormValues extends FieldValues> = {
	form?: UseFormReturn<TFormValues>;
	formData?: UseFormReturn<TFormValues>;
	name: Path<TFormValues>;
	label: string;
	placeholder?: string;
} & React.ComponentProps<"input">;

export default function PasswordInput<TFormValues extends FieldValues>({
	form,
	formData,
	name,
	label,
	placeholder,
}: PasswordInputProps<TFormValues>) {
	const [showPassword, setShowPassword] = useState(false);
	const activeForm = formData ?? form;

	if (!activeForm) {
		throw new Error("PasswordInput requires either form or formData.");
	}

	return (
		<FormField
			control={activeForm.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<div className="flex">
						<FormControl className="flex w-full">
							<div
								className={cn(
									"flex items-center justify-center border-gray-800 rounded-md border w-full",
									"focus-within:border-ring focus-within:ring-ring/20 focus-within:ring-[2px]",
									"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
								)}
							>
								<Input
									placeholder={placeholder}
									{...field}
									type={showPassword ? "text" : "password"}
									className="rounded-r-none border-0 shadow-none focus-visible:ring-0"
								/>
								<div
									className="flex items-center justify-center px-2 hover:cursor-pointer"
									onClick={() => setShowPassword((value) => !value)}
								>
									{showPassword ? <EyeIcon width={20} /> : <EyeOffIcon width={20} />}
								</div>
							</div>
						</FormControl>
					</div>
					<FormMessage className="text-red-500" />
				</FormItem>
			)}
		/>
	);
}
