<script lang="ts">
	import { goto } from "$app/navigation";
	import { api } from "$lib/services/api";
	import { userStore } from "$lib/stores/user";

	let email = $state("");
	let code = $state("");
	let error = $state("");
	let loading = $state(false);
	let step = $state<"email" | "code">("email");
	let rememberMe = $state(false);
	let codeInputRef: HTMLInputElement | undefined = $state();

	function syncCodeFromInput(el: HTMLInputElement) {
		code = el.value.replace(/\D/g, "").slice(0, 6);
	}

	async function handleRequestLink() {
		error = "";
		loading = true;

		try {
			await api.auth.requestLink(email);
			step = "code";
		} catch (err) {
			error = err instanceof Error ? err.message : "Failed to send code";
		} finally {
			loading = false;
		}
	}

	async function handleVerifyCode() {
		error = "";
		const raw = (codeInputRef?.value ?? code).replace(/\D/g, "").slice(0, 6);
		if (raw.length !== 6) {
			error = "Please enter the 6-digit code";
			return;
		}
		loading = true;

		try {
			const result = await api.auth.verify({ email, code: raw, rememberMe });
			userStore.login(result.user, result.token);
			const { onboarded } = await api.onboarding.status();
			goto(onboarded ? "/dashboard" : "/onboarding");
		} catch (err) {
			error = err instanceof Error ? err.message : "Verification failed";
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-[400px] mx-auto p-8">
	<h1 class="text-2xl font-medium text-[var(--foreground)] text-center mb-6">
		{step === "email" ? "Log in" : "Enter your code"}
	</h1>

	{#if error}
		<div
			class="mb-4 p-3 rounded-[var(--radius-m)] bg-[var(--color-error)] text-[var(--black)] text-sm"
		>
			{error}
		</div>
	{/if}

	{#if step === "email"}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleRequestLink();
			}}
			class="flex flex-col gap-4"
		>
			<div class="flex flex-col gap-1.5">
				<label for="email" class="text-sm font-medium">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="rounded-full border border-[var(--input)] bg-[var(--accent)] px-6 py-4 text-base"
				/>
			</div>

			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={rememberMe}
					class="mt-0.5 shrink-0 accent-[var(--primary)]"
				/>
				<span class="text-sm text-[var(--foreground)]">
					Remember me
					<span class="block text-xs text-[var(--muted-foreground)]">
						You will be signed in on this device for 14 days
					</span>
				</span>
			</label>

			<button
				type="submit"
				disabled={loading}
				class="rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-sm font-medium disabled:opacity-50"
			>
				{loading ? "Sending..." : "Continue"}
			</button>
		</form>

		<p class="mt-4 text-center text-sm text-[var(--muted-foreground)]">
			We'll send you a login code — no password needed.
		</p>
	{:else}
		<p class="mb-4 text-center text-sm text-[var(--muted-foreground)]">
			We sent a 6-digit code to <strong>{email}</strong>
		</p>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleVerifyCode();
			}}
			class="flex flex-col gap-4"
		>
			<div class="flex flex-col gap-1.5">
				<label for="code" class="text-sm font-medium">Code</label>
				<input
					id="code"
					type="text"
					inputmode="numeric"
					maxlength={6}
					autocomplete="one-time-code"
					bind:value={code}
					bind:this={codeInputRef}
					oninput={(e) => syncCodeFromInput(e.currentTarget)}
					onchange={(e) => syncCodeFromInput(e.currentTarget)}
					required
					class="rounded-full border border-[var(--input)] bg-[var(--accent)] px-6 py-4 text-base text-center tracking-[0.3em] font-mono"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 text-sm font-medium disabled:opacity-50"
			>
				{loading ? "Verifying..." : "Log in"}
			</button>
		</form>

		<button
			onclick={() => {
				step = "email";
				code = "";
				error = "";
			}}
			class="mt-4 block mx-auto text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
		>
			Use a different email
		</button>
	{/if}
</div>
