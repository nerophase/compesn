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
	onChange: any;
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

	return (
		<div className={`flex items-center text-text_primary`}>
			<input
				type="checkbox"
				name={id}
				id={id}
				checked={value}
				className={className}
				onChange={() => {
					if (!blocked) onChange();
				}}
				disabled={blocked}
			/>
			<label htmlFor={id} className="ml-2 select-none">
				{label}
			</label>
		</div>
	);
}
