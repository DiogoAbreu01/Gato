import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const file=path.resolve('src/lib/sheet-math.ts');
const {outputText}=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const mod={exports:{}};
new Function('module','exports',outputText)(mod,mod.exports);
const {calculateCell,colName,cellCoords,toCSV}=mod.exports;

test('Soma, multiplicação e referência de células são calculadas',()=>{
 const rows=[['10','=A1*2'],['4','=SUM(A1:A2)']];
 assert.equal(calculateCell(rows,0,1),'20');
 assert.equal(calculateCell(rows,1,1),'14');
 assert.equal(calculateCell([['=7/0']],0,0),'#DIV/0');
});
test('Referências circulares não se transformam silenciosamente em zero',()=>{
 assert.equal(calculateCell([['=SUM(A1:A1)']],0,0),'#CYCLE');
 assert.equal(calculateCell([['=B1+1','=A1+1']],0,0),'#CYCLE');
});
test('Referências AA..AD e limites de planilhas funcionam',()=>{
 assert.equal(colName(0),'A');
 assert.equal(colName(25),'Z');
 assert.equal(colName(26),'AA');
 assert.equal(colName(29),'AD');
 assert.deepEqual(cellCoords('AD250'),{row:249,col:29});
 assert.equal(cellCoords('AE1'),null);
 const row=Array(27).fill('0');row[0]='12';row[26]='=A1+2';
 assert.equal(calculateCell([row],0,26),'14');
 assert.equal(calculateCell([['=AD1+5']],0,0),'#REF');
});
test('CSV exporta valores calculados e neutraliza conteúdo perigoso',()=>{
 const data={columns:['Nome','=HYPERLINK("https://example.invalid")'],rows:[['-cmd','+SUM(1,1)'],['Planilha','=1+2'],['@cmd','\t=2+2'],['-10','=HYPERLINK("https://example.invalid")']]};
 const csv=toCSV(data);
 assert.match(csv,/"'=HYPERLINK/);
 assert.match(csv,/"'-cmd"/);
 assert.match(csv,/"'\+SUM/);
 assert.match(csv,/"3"/);
 assert.match(csv,/"'@cmd"/);
 assert.match(csv,/"-10"/);
 assert.match(csv,/"'=HYPERLINK/);
 assert.doesNotMatch(csv,/"=HYPERLINK/);
});
