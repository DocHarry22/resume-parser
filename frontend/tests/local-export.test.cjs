const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const JSZip = require('jszip');
const { webcrypto } = require('node:crypto');

const modules = {};
function load(name) {
  if (modules[name]) return modules[name];
  const source = fs.readFileSync(path.join(__dirname, `../components/resumeio/${name}.ts`), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: id => id === 'jszip' ? JSZip : load(id.replace('./', '')), crypto: webcrypto, structuredClone, Blob });
  return modules[name] = exports;
}

test('local DOCX is genuine OOXML and preserves Unicode, custom details, section order and page size', async () => {
  const { createDocument } = load('resumeDocument');
  const { localDocx, localText } = load('localExport');
  const doc = createDocument();
  doc.resume.contact.full_name = 'QA Local & Unicode Zoë';
  doc.resume.contact.email = 'qa@example.test';
  doc.resume.summary.summary = 'Original summary with <XML> & special characters.';
  doc.resume.skills = [{ category: 'Hidden category', skills: ['Hidden skill'] }];
  doc.resume.projects = [{ name: 'First project', description: 'An editable description', technologies: [], highlights: ['A measurable result'] }];
  doc.resume.custom_sections.Licences = 'A current professional licence';
  doc.design.pageSize = 'Letter';
  doc.design.sectionOrder = ['projects', ...doc.design.sectionOrder.filter(id => id !== 'projects')];
  doc.design.hiddenSections = ['skills'];
  const blob = await localDocx(doc);
  const buffer = Buffer.from(await blob.arrayBuffer());
  assert.equal(buffer.subarray(0, 2).toString(), 'PK');
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml').async('string');
  assert.match(xml, /QA Local &amp; Unicode Zoë/);
  assert.match(xml, /&lt;XML&gt; &amp; special characters/);
  assert.match(xml, /A current professional licence/);
  assert.ok(xml.indexOf('Projects') < xml.indexOf('Professional summary'));
  assert.doesNotMatch(xml, /Hidden skill/);
  assert.match(xml, /w:w="12240" w:h="15840"/);
  assert.ok(zip.file('[Content_Types].xml'));
  assert.ok(zip.file('_rels/.rels'));
  const text = await localText(doc).text();
  assert.match(text, /QA Local & Unicode Zoë/);
  assert.doesNotMatch(text, /Hidden skill/);
  const output = path.resolve(__dirname, '../../docs/qa');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'local-editor-export.docx'), buffer);
  fs.writeFileSync(path.join(output, 'local-editor-export.txt'), text);
});
