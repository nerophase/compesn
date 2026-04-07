export const validatePassword = (password: string) => {
	password = password.trim();

	// Should have 8 or more characters
	if (password.length < 8) return "The password should have 8 or more characters";

	// At least one lowercase letter
	const regex1 = /[a-z]/;
	if (!regex1.test(password)) return "The password must have at least one lowercase letter";

	// At least one uppercase letter
	const regex2 = /[A-Z]/;
	if (!regex2.test(password)) return "The password must have at least one uppercase letter";

	// At least one digit
	const regex3 = /[\d]/;
	if (!regex3.test(password)) return "The password must have at least one digit";

	// At least one special symbol
	const regex4 = /[!@#$%^&*.?]/;
	if (!regex4.test(password)) return "The password must have at least one special symbol";
};
