const copyButtonLabel = "copy code";
const blocks = document.querySelectorAll("pre");

blocks.forEach((block) => {
	// only add button if browser supports Clipboard API
	if (navigator.clipboard) {
		const wrapper = document.createElement("span");
		wrapper.classList.add("copy-code");
		const button = document.createElement("button");
		button.innerText = copyButtonLabel;
		wrapper.appendChild(button);

		block.insertAdjacentElement("beforebegin", wrapper);

		button.addEventListener("click", async () => {
			await copyCode(block, button);
		});
	}
});

async function copyCode(block, button) {
	const code = block.querySelector("code");
	const text = code.innerText;

	await navigator.clipboard.writeText(text);

	// visual feedback that task is completed
	button.innerHTML = "&#9989; code copied";

	setTimeout(() => {
		button.innerText = copyButtonLabel;
	}, 700);
}
