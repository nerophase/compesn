export default function Modal({
	children,
	isActive,
	modalClassName,
	onEnter,
}: {
	children?: React.ReactNode;
	isActive?: boolean;
	modalClassName?: string;
	onEnter?: () => void;
}) {
	return (
		<>
			<div
				className={`absolute w-screen h-screen flex justify-center items-center bg-blur ${
					isActive ? "opacity-100 z-40" : "opacity-0 hidden"
				}`}
			></div>
			<div
				className={
					modalClassName +
					` absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-16 py-10 text-text_primary border-2 bg-bg_primary z-50 rounded-md ${
						!isActive ? "hidden" : ""
					}`
				}
				onKeyDown={(e) => {
					if (e.key === "Enter" && onEnter) {
						onEnter();
					}
				}}
			>
				{children}
			</div>
		</>
	);
}
