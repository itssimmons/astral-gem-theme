import chalk from "chalk";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

import type { IYAML } from "./types";

const start = performance.now();
let themeCount = 0;

const log = console.log.bind(console);

const generateTheme = async (content: IYAML.Content, outDir: string) => {
	let fileName = content.file_name as string;
	const themeName = (content.theme_name as null | string) || fileName;

	if (fileName === null) {
		log("⚠️ No file name provided, skipping");
		return;
	}

	if (fileName.endsWith(".json")) {
		fileName = fileName.slice(0, -5);
	}

	delete content.file_name;
	delete content.tokens;

	fileName = fileName.toLowerCase(); // to preserve project casing

	if (!content.theme_schema) {
		log("⚠️ No theme schema provided, skipping");
		return;
	}

	const vscodeTheme = {
		$schema: "vscode://schemas/color-theme",
		type: "dark",
		name: themeName,
		...content.theme_schema
	};

	await fs.writeFile(
		path.join(outDir, `${fileName}.json`),
		JSON.stringify(vscodeTheme, null, 2)
	);
	themeCount += 1;

	const bar = os.platform() === "win32" ? "\\" : "/";

	log(
		chalk.bold`✨ Generated theme:` +
			" " +
			chalk.blue`${outDir}${bar}${fileName}.json`
	);
};

const getThemeContent = async (fileDir: string): Promise<IYAML.Content> => {
	const absPath = path.join(IN_DIR, fileDir);
	const content = await fs.readFile(absPath, "utf8");
	return YAML.parse(content);
};

const ROOT_DIR = process.cwd();
const IN_DIR = path.join(ROOT_DIR, "src", "themes");
const OUT_DIR = path.join(ROOT_DIR, "themes");

const schemaContent = await fs.readdir(IN_DIR);

await Promise.allSettled(
	schemaContent.map(async (file) => {
		if (file.endsWith(".yml") || file.endsWith(".yaml")) {
			const theme = await getThemeContent(file);
			await generateTheme(theme, OUT_DIR);
		}
	})
);

const end = performance.now();
const time = (end - start) / 1000;

log(chalk.dim`\n${themeCount} Themes generated in ${time.toFixed(3)}s`);
