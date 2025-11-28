import * as shell from "shelljs";

shell.mkdir("-p", "dist/public/js");
shell.mkdir("-p", "dist/public/css");

shell.cp("-R", "src/views", "dist/");

shell.cp("-R", "src/public/css", "dist/public/");
shell.cp("-R", "src/public/js", "dist/public/");

shell.rm("-f", "dist/public/js/*.ts");
shell.rm("-f", "dist/public/js/*.json");

console.log("✓ Assets copied successfully");
