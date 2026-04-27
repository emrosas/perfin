<script lang="ts">
	let { class: className }: { class?: string } = $props();
</script>

<svg
	class={className}
	width="40"
	height="40"
	viewBox="0 0 40 40"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<g clip-path="url(#transfer-clip)">
		<rect x="40" y="16" width="26.9696" height="5" transform="rotate(-180 40 16)" fill="currentColor" />
		<path
			d="M17.0304 7L10.5304 13.5L17.0304 20L20.0304 17L16.5304 13.5L20.0304 10L17.0304 7Z"
			fill="currentColor"
		/>
		<rect y="24" width="27" height="5" fill="currentColor" />
		<path d="M23 33L29.5 26.5L23 20L20 23L23.5 26.5L20 30L23 33Z" fill="currentColor" />
	</g>
	<defs>
		<clipPath id="transfer-clip">
			<rect width="40" height="40" fill="white" />
		</clipPath>
	</defs>
</svg>
