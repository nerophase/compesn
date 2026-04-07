import { accounts, TUserInsert, users } from "@compesn/shared/common/schemas";
import { eq } from "drizzle-orm";
import { v4 } from "uuid";
import { db } from "@/database";

const getUserById = async (userId: string) => {
	return await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: {
			accounts: true,
			usersToTeams: {
				with: {
					team: true,
				},
			},
		},
	});
};

const getUserByName = async (name: string) => {
	return await db.query.users.findFirst({ where: eq(users.name, name) });
};

const getUserByEmail = async (email: string) => {
	return await db.query.users.findFirst({ where: eq(users.email, email) });
};

const getUserByAccount = async (accountId: string) => {
	return await db.query.users.findFirst({
		with: { accounts: { where: eq(accounts.id, accountId) } },
	});
};

const getUsers = async () => {
	return await db.query.users.findMany();
};

const createUser = async (user: TUserInsert) => {
	if (await db.query.users.findFirst({ where: eq(users.name, user.name) })) {
		user.name = `${user.name} ${v4().slice(0, 4)}`;
	}

	return (await db.insert(users).values(user).returning())[0];
};

const updateUser = async (userId: string, user: TUserInsert) => {
	return (await db.update(users).set(user).where(eq(users.id, userId)).returning())[0];
};

const deleteUser = async (userId: string) => {
	return await db.delete(users).where(eq(users.id, userId));
};

export const userService = {
	getUserById,
	getUserByName,
	getUserByEmail,
	getUserByAccount,
	getUsers,
	createUser,
	updateUser,
	deleteUser,
};
