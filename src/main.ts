#!/usr/bin/env -S npx tsx

import("./cli").then(({ default: CLI }) => CLI.run());
