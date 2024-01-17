const path = require("path");
const eleventyImage = require("@11ty/eleventy-img");

module.exports = (eleventyConfig) => {
	function relativeToInputPath(inputPath, relativeFilePath) {
		let split = inputPath.split("/");
		split.pop();

		return path.resolve(split.join(path.sep), relativeFilePath);
	}

	// Eleventy Image shortcode
	// https://www.11ty.dev/docs/plugins/image/
	eleventyConfig.addAsyncShortcode(
		"image",
		async function imageShortcode(src, alt, widths, sizes, caption) {
			// Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
			let formats = ["webp", "auto"];
			let file = relativeToInputPath(this.page.inputPath, src);
			let metadata = await eleventyImage(file, {
				widths: widths || ["auto"],
				formats,
				sharpOptions: {
					animated: true,
				},
				outputDir: path.join(eleventyConfig.dir.output, "img"), // Advanced usage note: `eleventyConfig.dir` works here because we’re using addPlugin.
			});

			// add og:image on the page
			const coverImage = metadata.webp?.[0];

			if (
				coverImage &&
				coverImage.width === 1200 &&
				coverImage.height === 627
			) {
				this.page.ogImage = coverImage.url;
			}

			// TODO loading=eager and fetchpriority=high
			let imageAttributes = {
				alt,
				sizes,
				loading: "lazy",
				decoding: "async",
			};
			const eleventyImageOutput = eleventyImage.generateHTML(
				metadata,
				imageAttributes
			);

			return caption
				? `<figure>
			${eleventyImageOutput}
			<figcaption>${caption}</figcaption>
		</figure>`
				: `<div class='no-caption'>${eleventyImageOutput}</div>`;
		}
	);
};
