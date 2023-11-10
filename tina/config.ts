import { defineConfig } from "tinacms";

const branch = "main";

export default defineConfig({
	branch,
	clientId: "e0552649-e227-4fd4-9805-93955435697a",
	token: "37c7edc846a16da993fb7d1afa42a4a37c8d7504",

	build: {
		outputFolder: "sophie",
		publicFolder: "public",
	},
	media: {
		tina: {
			mediaRoot: "",
			publicFolder: "public",
		},
	},
	schema: {
		collections: [
			{
				name: "post",
				label: "Posts",
				path: "content/blog",
				fields: [
					{
						type: "string",
						name: "title",
						label: "Title",
						isTitle: true,
						required: true,
					},
					{
						type: "string",
						name: "description",
						label: "Description",
						required: true,
					},
					{
						type: "datetime",
						name: "date",
						label: "Date",
						required: true,
					},
					{
						type: "string",
						name: "tags",
						label: "Tags",
						required: true,
						list: true,
					},
					{
						type: "rich-text",
						name: "body",
						label: "Body",
						isBody: true,
					},
				],
			},
		],
	},
	search: {
		tina: {
			indexerToken: "068e92a5b4ddcfa4133f6beb52db6c42e3a25c3c",
			stopwordLanguages: ["eng"],
		},
		indexBatchSize: 100,
		maxSearchIndexFieldLength: 100,
	},
});
