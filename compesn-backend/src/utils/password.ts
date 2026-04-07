import bcrypt from "bcrypt";
export { generateId } from "@compesn/shared/utils/id";

export const encryptPassword = async (password: string): Promise<string> => {
	return bcrypt.hash(password, 10);
};

export const checkPassword = async (
	plainPassword: string,
	encryptedPassword: string,
): Promise<boolean> => {
	return bcrypt.compare(plainPassword, encryptedPassword);
};
