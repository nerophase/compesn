import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	if (session?.user?.role && session?.user?.role !== "admin") {
		redirect("/auth/login");
	}

	return children;
}
