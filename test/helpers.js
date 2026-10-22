const { loadCore } = require("./load-core");
const { Core } = loadCore();

// Values made inside the vm sandbox have that realm's prototypes; flatten them for deepStrictEqual.
const plain = v => JSON.parse(JSON.stringify(v));

const HEADER = "Date,Type,Title,Info,Currency,Amount,Fees & Taxes,Net,Tax Details";
const csv = (...lines) => [HEADER, ...lines].join("\n");
const analyze = (...files) => Core.analyze(files.map((text, i) => (typeof text === "string" ? { name: `s${i + 1}.csv`, text } : text)));

module.exports = { Core, plain, HEADER, csv, analyze };
