<script lang="ts">
	let { class: className }: { class?: string } = $props();
</script>

<svg
	class={className}
	width="24"
	height="24"
	viewBox="0 0 48 48"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<rect x="22" y="13" width="4" height="22" fill="currentColor" />
	<rect x="35" y="22" width="4" height="22" transform="rotate(90 35 22)" fill="currentColor" />
</svg>
