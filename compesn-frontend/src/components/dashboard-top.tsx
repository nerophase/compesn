import React from "react";

export default function DashboardHeader({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="mb-6 flex justify-between w-full">
			<div>
				<h1 className="text-3xl font-bold">{title}</h1>
				<p className="text-muted-foreground">{description}</p>
			</div>
			<div>{children}</div>
		</div>
	);
}
