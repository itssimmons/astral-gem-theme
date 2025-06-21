import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

import { generateTheme, getThemeContent, updatePackageJson } from "./build";
import CLI from "./cli";
import { log } from "./logger";
import type { Builder } from "./types";

const rootDir = process.cwd();
const vscodeThemeDir = path.join(rootDir, "themes");
const schemasDir = path.join(rootDir, "src", "themes");

export const checkPackageJson = async () => {
	const packageJsonPath = path.join(rootDir, "package.json");
	const packageJson = await fs.readFile(packageJsonPath, "utf8");
	const jsonPackage = JSON.parse(packageJson);

	const packageJsonThemes = (
		jsonPackage.contributes.themes as Builder.Theme[]
	).map((t) => ({ ...t, path: t?.path?.split("/").pop() || "" }));

	const schemas = await Promise.all(
		(await fs.readdir(schemasDir)).map(async (s) => {
			const rawYaml = await fs.readFile(path.join(schemasDir, s), "utf8");
			const jsonContent = YAML.parse(rawYaml);
			const fileName = jsonContent.file_name as string;
			return fileName;
		})
	);

	const vscodeThemes = await fs.readdir(vscodeThemeDir);

	log("package.json registered themes: ", packageJsonThemes);
	log("VSCode themes: ", vscodeThemes);
	log("Schemas: ", schemas);
	log("\n");

	// 1st check if package.json has an schema for each theme
	const missingThemes = packageJsonThemes.filter(
		(t) => !schemas.includes(t.path)
	);
	if (missingThemes.length > 0) {
		missingThemes.forEach((t) => {
			log(
				"🔍 Theme " +
					chalk.underline.bold`${t.label}` +
					" not found in ./themes folder"
			);
		});

		await CLI.decide("What do you want to do?", {
			"Generate missing themes"() {
				// TO-DO: generative function
				log("Generating missing themes...\n");
			},
			Ignore() {
				// ...
			}
		});
	}

	// 1.1 check for the unregistered themes (maybe not necessary)
	// const missingVscodeThemes = vscodeThemes.filter(
	// 	(t) => !packageJsonThemes.find((p) => p.path === t)
	// );

	// if (missingVscodeThemes.length > 0) {
	// 	missingVscodeThemes.forEach((t) => {
	// 		log(
	// 			"⚠️ Theme file " +
	// 				chalk.underline.bold`${t}` +
	// 				" is not registered yet in package.json"
	// 		);
	// 	});
	// }

	// 2nd check if ./themes exists but schema files are missing
	const missingSchemas = vscodeThemes.filter((s) => !schemas.includes(s));

	if (missingSchemas.length > 0) {
		missingSchemas.forEach((s) => {
			log("🎨 No schema found for theme " + chalk.underline.bold`${s}`);
		});

		await CLI.decide("What do you want to do?", {
			"Generate missing schemas"() {
				// TO-DO: generative function
				log("Generating missing schemas...\n");
			},
			Ignore() {
				// ...
			}
		});
	}

	// 3rd check if schema files exist but package.json themes are missing
	// ignore this because the build script will generate the missing themes
};

checkPackageJson();

export const watchSchemas = async () => {
	// src/themes/**/*.{yaml,yml}
	const watcher = fs.watch(schemasDir, {
		encoding: "utf8",
		recursive: true
	});

	for await (const ev of watcher) {
		const fileName = ev.filename || "";

		if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
			const absPath = path.join(schemasDir, fileName);
			const jsonContent = await getThemeContent(absPath);
			const contributedTheme = await generateTheme(jsonContent, vscodeThemeDir);

			if (!contributedTheme) continue;

			await updatePackageJson(contributedTheme);
		}
	}
};
