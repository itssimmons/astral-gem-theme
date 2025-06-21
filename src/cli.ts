import chalk from "chalk";
import rlp from "node:readline";

import { log } from "./logger";
import { checkPackageJson, watchSchemas } from "./watcher";
import Keys from "./keys";

class CLI {
	static async run() {
		await checkPackageJson();
		watchSchemas();
	}

	static decide(
		title: string,
		options: { [key: string]: () => void }
	) {
		return new Promise((resolve) => {
			const choices = Object.keys(options);
			let choice = 0;
			let linesPrinted = 0;

			const rl = rlp.createInterface({
				input: process.stdin,
				output: process.stdout
			});



			const listener = (data: Buffer) => {
				if (data.equals(Keys.ArrowDown)) {
					choice = (choice + 1) % choices.length;
				}

				if (data.equals(Keys.ArrowUp)) {
					choice = (choice + choices.length - 1) % choices.length;
				}

				if (data.equals(Keys.Enter)) {
					rl.close();
					process.stdin.removeListener("data", listener);
					process.stdin.setRawMode(false);
					process.stdin.pause();

					options[choices[choice]]();
					return resolve(choice);
				}

				render();
			};

			const render = () => {
				for (let i = 0; i < linesPrinted; i++) {
					rlp.moveCursor(process.stdout, 0, -1);
					rlp.clearLine(process.stdout, 0);
				}

				const output: string[] = [];
				output.push(chalk.bold.green`? ` + chalk.bold`${title}`);
				output.push(
					...choices.map((c, i) => {
						const chevron = i === choice ? ">" : " ";
						const underline = i === choice ? chalk.underline(c) : c;
						return chevron + " " + underline;
					})
				);

				linesPrinted = output.length;

				log(output.join("\n"));
			};

			process.stdin.setRawMode(true);
			process.stdin.resume();

			process.stdin.on("data", listener);

			log();
			render();
		});
	}
}

export default CLI;
