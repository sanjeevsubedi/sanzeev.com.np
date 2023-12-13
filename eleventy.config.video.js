const path = require("path");

module.exports = (eleventyConfig) => {
	const videoFolder = "video";
	eleventyConfig.addPassthroughCopy({
		"**/*.mp4": videoFolder,
	});

	eleventyConfig.addAsyncShortcode(
		"video",
		async function videoShortcode(src, caption) {
			return `
					<figure>
						<video controls preload="none" class="lazy">
							<source data-src="/${videoFolder}/${src}" type="video/mp4">
							Your browser does not support the video tag.
						</video>
						<figcaption>${caption}</figcaption>
					</figure>
				`;
		}
	);
};
