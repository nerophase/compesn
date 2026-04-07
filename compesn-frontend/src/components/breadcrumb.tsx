"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "lucide-react";
import { Fragment } from "react";

interface BreadcrumbItem {
	label: string;
	href: string;
	isLast?: boolean;
}

export function Breadcrumb() {
	const pathname = usePathname();

	// Generate breadcrumb items from pathname
	const generateBreadcrumbs = (): BreadcrumbItem[] => {
		const segments = pathname.split("/").filter(Boolean);
		const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

		let currentPath = "";
		segments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const isLast = index === segments.length - 1;

			// Handle special cases for dynamic routes and readable labels
			let label = segment;
			if (segment === "scrims") {
				label = "Scrims";
			} else if (segment === "teams") {
				label = "Teams";
			} else if (segment === "messages") {
				label = "Messages";
			} else if (segment === "queue") {
				label = "Queue";
			} else if (segment === "scrims-only") {
				label = "Scrims";
			} else if (
				segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
			) {
				// UUID pattern - this would be a team ID
				label = "Team Details";
			} else if (segment === "create") {
				label = "Create";
			} else {
				// Capitalize first letter and replace hyphens with spaces
				label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
			}

			breadcrumbs.push({
				label,
				href: currentPath,
				isLast,
			});
		});

		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();

	// Don't show breadcrumbs on home page
	if (pathname === "/") {
		return null;
	}

	return (
		<nav
			className="flex items-center space-x-2 text-sm text-gray-400 mb-6"
			aria-label="Breadcrumb"
		>
			<ol className="flex items-center space-x-2">
				{breadcrumbs.map((item, index) => (
					<Fragment key={item.href}>
						<li className="flex items-center">
							{index === 0 ? (
								<Link
									href={item.href}
									className="flex items-center hover:text-cyan-400 transition-colors"
								>
									<HomeIcon className="h-4 w-4" />
									<span className="sr-only">{item.label}</span>
								</Link>
							) : item.isLast ? (
								<span className="text-cyan-400 font-medium" aria-current="page">
									{item.label}
								</span>
							) : (
								<Link
									href={item.href}
									className="hover:text-cyan-400 transition-colors"
								>
									{item.label}
								</Link>
							)}
						</li>
						{index < breadcrumbs.length - 1 && (
							<li>
								<ChevronRightIcon className="h-4 w-4 text-gray-500" />
							</li>
						)}
					</Fragment>
				))}
			</ol>
		</nav>
	);
}
