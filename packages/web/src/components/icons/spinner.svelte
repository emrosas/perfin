<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<svg
	class={className}
	width="16"
	height="16"
	viewBox="0 0 16 16"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<path
		fill-rule="evenodd"
		clip-rule="evenodd"
		d="M8 3C10.7614 3 13 5.23858 13 8H14C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14V13C5.23858 13 3 10.7614 3 8C3 5.23858 5.23858 3 8 3Z"
		fill="#FEFAFE"
	/>
	<rect x="12" y="6" width="3" height="3" rx="1.5" fill="#FEFAFE" />
</svg>
