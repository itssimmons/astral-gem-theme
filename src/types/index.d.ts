export declare namespace Builder {
  export interface YAMLContent {
		file_name: string;
		theme_label: string;
		ui_theme: string;
		tokens?: {
			colors?: {
				[key: string]: string;
			};
		};
		theme_schema: {
			semanticHighlighting?: boolean;
			semanticTokenColors?: {
				[key: string]: string;
			};
			colors: {
				[key: string]: string;
			};
			tokenColors?: {
				[key: string]: string;
			};
		};
  }
	
	export interface Theme {
		label: string;
		path: string;
		uiTheme: string;
		id: string;
	}
	
	export interface PackageJSON {
		contributes: {
			themes: Theme[];
		};
	}
}