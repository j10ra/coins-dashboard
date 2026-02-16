import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { saveKeys } from "@/server/keys.functions";

export const Route = createFileRoute("/_authenticated/setup-keys")({
	component: SetupKeys,
});

function SetupKeys() {
	const id = useId();
	const [apiKey, setApiKey] = useState("");
	const [secretKey, setSecretKey] = useState("");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (data: { apiKey: string; secretKey: string }) =>
			saveKeys({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["keys"] });
			queryClient.invalidateQueries({ queryKey: ["account"] });
			navigate({ to: "/" });
		},
	});

	return (
		<div className="p-6">
			<div className="mx-auto max-w-md space-y-6">
				<h1 className="text-2xl font-bold text-white">Connect Coins.ph</h1>
				<p className="text-slate-400 text-sm">
					Enter your API credentials. Keys are encrypted and stored securely.
				</p>

				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						mutation.mutate({ apiKey, secretKey });
					}}
				>
					<div>
						<label
							htmlFor={`${id}-apiKey`}
							className="block text-sm text-slate-300 mb-1"
						>
							API Key
						</label>
						<input
							id={`${id}-apiKey`}
							type="text"
							value={apiKey}
							onChange={(e) => setApiKey(e.target.value)}
							className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
							required
						/>
					</div>

					<div>
						<label
							htmlFor={`${id}-secretKey`}
							className="block text-sm text-slate-300 mb-1"
						>
							Secret Key
						</label>
						<input
							id={`${id}-secretKey`}
							type="password"
							value={secretKey}
							onChange={(e) => setSecretKey(e.target.value)}
							className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
							required
						/>
					</div>

					{mutation.error && (
						<p className="text-red-400 text-sm">{mutation.error.message}</p>
					)}

					<button
						type="submit"
						disabled={mutation.isPending}
						className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
					>
						{mutation.isPending ? "Saving..." : "Save & Continue"}
					</button>
				</form>
			</div>
		</div>
	);
}
