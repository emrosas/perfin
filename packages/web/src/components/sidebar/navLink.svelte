<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	let {
		href,
		label,
		icon,
		match
	}: {
		href: string;
		label: string;
		icon: Snippet<[{ class: string }]>;
		match?: (pathname: string) => boolean;
	} = $props();

	const isActive = $derived(
		match ? match(page.url.pathname) : page.url.pathname.startsWith(href)
	);
</script>

<a
	{href}
	aria-current={isActive ? 'page' : undefined}
	class="text-dark flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base leading-none transition-colors
		hover:bg-brand/5
		aria-page:bg-brand aria-page:text-white aria-page:shadow-[0_0_12px_rgba(62,59,241,0.25)] aria-page:hover:bg-brand"
>
	{@render icon({ class: 'size-6 shrink-0' })}
	<span>{label}</span>
</a>
