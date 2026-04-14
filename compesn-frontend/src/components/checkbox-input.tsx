import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

export default function CheckboxInput({
	label,
	id,
	onChange,
	value,
	className,
	blocked,
}: {
	label: string;
	id: string;
	onChange: (checked: boolean | "indeterminate") => void;
	value: boolean;
	className?: string;
	blocked: boolean;
}) {
	return (
		<div className="flex items-center gap-2">
			<Checkbox
				id={id}
				className="hover:cursor-pointer"
				checked={value}
				onCheckedChange={onChange}
			/>
			<Label htmlFor={id} className="font-normal">
				{label}
			</Label>
		</div>
	);
}
