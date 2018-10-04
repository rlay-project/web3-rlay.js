const fs = require("fs");
const child_process = require("child_process");

const contractFiles = [
  "OntologyStorage.json",
  "RlayToken.json",
  "PropositionLedger.json",
];

contractFiles.forEach(contractFile => {
  const fullPath = `./src/${contractFile}`;
  const stdout = child_process.execSync(
    `jq '. | del(.ast, .legacyAST, .bytecode, .deployedBytecode, .sourceMap, .deployedSourceMap, .source, .sourcePath)' ${fullPath}`
  );
  fs.writeFileSync(fullPath, stdout);
});
console.log("Deleted ASTs");
