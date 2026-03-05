const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('milk accounting MA nov 04.xls');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // get non-empty rows up to 25
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const output = [];

    for (let i = 0; i < Math.min(25, data.length); i++) {
        output.push(`ROW ${i + 1} : ` + JSON.stringify(data[i]));
    }

    fs.writeFileSync('excel_dump.txt', output.join('\n'));
    console.log("Dumped to excel_dump.txt successfully.");
} catch (e) {
    console.error(e.message);
}
