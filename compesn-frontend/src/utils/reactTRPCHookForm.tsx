import React, { useId } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormProps, UseFormReturn, FieldValues, SubmitHandler } from "react-hook-form";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { TRPCClientError } from "@trpc/client";
import type { z, ZodType } from "zod";

// -----------------------------------------------------------------------------
// 1. Basic Zod + RHF wrapper (same as your example)
// -----------------------------------------------------------------------------
type UseZodForm<TInput extends FieldValues> = UseFormReturn<TInput> & {
	id: string;
};

export function useZodForm<TSchema extends ZodType<any, any>>(
	props: Omit<UseFormProps<z.infer<TSchema>>, "resolver"> & { schema: TSchema },
): UseZodForm<z.infer<TSchema>> {
	const form = useForm<z.infer<TSchema>>({
		...props,
		resolver: zodResolver(props.schema, undefined, { raw: true }),
	}) as UseZodForm<z.infer<TSchema>>;

	form.id = useId();

	return form;
}

// -----------------------------------------------------------------------------
// 2. tRPC mutation form integration
// -----------------------------------------------------------------------------
type MutationResult<TInput> = {
	mutateAsync: (input: TInput) => Promise<any>;
	isPending: boolean;
};

/**
 * Hook to wire up a Zod schema + RHF form with a tRPC mutation.
 *
 * @param mutation  the object returned by e.g. `const m = trpc.post.create.useMutation()`
 * @param props     same props as useZodForm (defaultValues, mode, etc) + your Zod schema
 *
 * @returns
 *  - `form`: your RHF form instance (with `id`)
 *  - `onSubmit`: pass this to `<form onSubmit={onSubmit}>` (already wrapped in `.handleSubmit`)
 *  - `isLoading`: mirror of `mutation.isLoading`
 */
export function useTRPCMutationForm<TSchema extends ZodType<any, any>>(
	mutation: MutationResult<z.infer<TSchema>>,
	props: Omit<UseFormProps<z.infer<TSchema>>, "resolver"> & { schema: TSchema },
) {
	const form = useZodForm(props);

	// Our server‐calling submit handler
	const onSubmit: SubmitHandler<z.infer<TSchema>> = async (values) => {
		try {
			await mutation.mutateAsync(values);
		} catch (error) {
			// Map Zod errors returned via tRPC
			if (error instanceof TRPCClientError && (error.data as any)?.zodError) {
				const zodErr = (error.data as any).zodError as {
					fieldErrors: Record<string, string[]>;
				};

				for (const [field, msgs] of Object.entries(zodErr.fieldErrors)) {
					if (msgs?.length) {
						form.setError(field as any, {
							type: "server",
							message: msgs.join(", "),
						});
					}
				}
			} else {
				// Fallback to root error
				form.setError("root.server", {
					type: "server",
					message: (error as Error).message,
				});
			}
		}
	};

	return {
		form,
		onSubmit: form.handleSubmit(onSubmit),
		isPending: mutation.isPending,
	};
}

// -----------------------------------------------------------------------------
// 3. Form + SubmitButton components
// -----------------------------------------------------------------------------
export function TRPCForm<TInput extends FieldValues>(
	props: Omit<React.ComponentProps<"form">, "onSubmit" | "id"> & {
		form: UseFormReturn<TInput> & { id: string };
		onSubmit: React.FormEventHandler<HTMLFormElement>;
	},
) {
	const { form, onSubmit, ...rest } = props;

	return (
		<FormProvider {...form}>
			<form {...rest} id={form.id} onSubmit={onSubmit} />
		</FormProvider>
	);
}

export function SubmitButton(
	props: Omit<React.ComponentProps<"button">, "type" | "form"> & {
		form?: UseFormReturn<any> & { id?: string };
	},
) {
	const formIdFallback = useId();
	const context = useFormContext();
	const form = props.form ?? context;

	if (!form) {
		throw new Error("SubmitButton must be inside <TRPCForm> or receive a `form` prop");
	}

	const { isSubmitting } = form.formState;
	const formId = (form as any).id || formIdFallback;

	return (
		<button {...props} form={formId} type="submit" disabled={isSubmitting}>
			{isSubmitting ? "Loading…" : props.children}
		</button>
	);
}
