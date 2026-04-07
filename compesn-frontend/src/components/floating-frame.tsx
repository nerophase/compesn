export default function FloatingFrame({ children }: { children?: React.ReactNode }) {
	return (
		<div className="w-full h-full flex items-center justify-center">
			<div className="bg-background w-full h-full max-w-2xl max-h-[80%] py-6 px-10 flex flex-col">
				{children}
			</div>
		</div>
	);
}
