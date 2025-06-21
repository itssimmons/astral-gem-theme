import chalk from "chalk";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

import { log } from "./logger";
import type { Builder } from "./types";

const rootDir = process.cwd();

export const generateTheme = async (
	content: Builder.YAMLContent,
	outDir: string
) => {
	let { file_name: fileName, theme_label: themeLabel } = content;
	const {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		tokens: _,
		ui_theme: themeUiTheme,
		theme_schema: themeSchema
	} = content;

	if (fileName === null) {
		log("⚠️ No file name provided, skipping");
		return;
	}

	if (fileName.endsWith(".json")) {
		fileName = fileName.slice(0, -5);
	}

	fileName = fileName.toLowerCase(); // to preserve project casing
	themeLabel ||= fileName;

	if (!themeSchema) {
		log("⚠️ No theme schema provided, skipping");
		return;
	}

	const vscodeTheme = {
		$schema: "vscode://schemas/color-theme",
		...themeSchema
	};

	await fs.writeFile(
		path.join(outDir, `${fileName}.json`),
		JSON.stringify(vscodeTheme, null, 2)
	);

	const bar = os.platform() === "win32" ? "\\" : "/";

	log(
		chalk.bold`✨ Generated theme:` +
			" " +
			chalk.blue`${outDir}${bar}${fileName}.json`
	);

	const themeRelativePath =
		"./" +
		path
			.relative(rootDir, path.join("themes", `${fileName}.json`))
			.replace(/\\/g, "/");

	return {
		// TO-DO: Generate a proper id
		id: "XXXX-XXXX-XXXX",
		label: themeLabel,
		uiTheme: themeUiTheme,
		path: themeRelativePath
	};
};

export const getThemeContent = async (
	yamlPath: string
): Promise<Builder.YAMLContent> => {
	const content = await fs.readFile(yamlPath, "utf8");
	const jsonTheme = YAML.parse(content);
	return jsonTheme;
};

export const updatePackageJson = async (theme: {
	label: string;
	path: string;
	uiTheme: string;
	id: string;
}) => {
	const packageJsonPath = path.join(rootDir, "package.json");
	const packageJson = await fs.readFile(packageJsonPath, "utf8");
	let jsonPackage = JSON.parse(packageJson);

	// TO-DO: Check structure of the theme
	// TO-DO: Check if the theme is already in the package.json

	const themes = [...jsonPackage.contributes.themes];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id: _, ...newTheme } = theme;

	// TO-DO: separate the logic to a function
	const i = themes.findIndex((t) => t.label === newTheme.label);

	if (i !== -1) {
		themes[i] = newTheme;
	} else {
		themes.push(newTheme);
	}

	jsonPackage = {
		...jsonPackage,
		contributes: {
			...jsonPackage.contributes,
			themes: [...themes]
		}
	};

	await fs.writeFile(packageJsonPath, JSON.stringify(jsonPackage, null, 2));
};
