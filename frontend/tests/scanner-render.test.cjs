const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function component(name) {
  const filename = path.resolve(__dirname, '../app/components', name + '.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = module.paths; mod._compile(compiled, filename);
  return mod.exports.default;
}
const ScoreBreakdown = component('ScoreBreakdown');
const ResumeResultCard = component('ResumeResultCard');
// Synthetic sparse candidate; metric keys follow the actual serialized
// ScoringService.score_resume dict (not the older metric model examples).
const sparseResume = {
  name: 'SCANNER REGRESSION CANDIDATE', contact: { email: 'scanner@example.test' },
  summary: null, experience: [], education: [], skills: [], projects: [],
  certifications: [], languages: [], raw_text: 'SCANNER REGRESSION CANDIDATE scanner@example.test',
};
const basic = {
  mode: 'basic', overall: 51.4, ats_compliance: 60, readability: 73, layout: 21,
  experience: null, skills: null, job_match: null,
  comments: ['Add a professional summary.'], flags: ['Missing work experience.'],
  detailed_metrics: {
    readability: { flesch_reading_ease: 62.7, flesch_kincaid_grade: 8.1, avg_words_per_sentence: 5.2 },
    layout: { word_count: 5, estimated_pages: 0.01 },
    structure: { has_contact: true, has_summary: false, has_experience: false, has_education: false, has_skills: false },
  },
};
const render = score => renderToStaticMarkup(React.createElement(ScoreBreakdown, { score }));
const row = (html, label, value) => assert.match(html, new RegExp(label + ':</span><span class="font-medium">' + value + '</span>'));

test('basic sparse response renders both result cards, measured layout and feedback without optional analyses', () => {
  const html = render(basic);
  const resume = renderToStaticMarkup(React.createElement(ResumeResultCard, { resume: sparseResume }));
  assert.match(resume, /SCANNER REGRESSION CANDIDATE/);
  assert.match(resume, /scanner@example.test/);
  row(html, 'Word Count', '5'); row(html, 'Estimated Pages', '0.0');
  row(html, 'Flesch Reading Ease', '62.7'); row(html, 'Has Contact Info', 'Yes'); row(html, 'Has Summary', 'No');
  assert.match(html, /Add a professional summary/); assert.match(html, /Missing work experience/);
  assert.doesNotMatch(html, /Total Roles|Total Skills|Sections Found|Length Status|Optimal|NaN|undefined/);
});

for (const mode of ['ats', 'expert']) {
  test(mode + ' renders supplied experience, skills, job match and legitimate zero measurements', () => {
    const score = { ...basic, mode, experience: 0, skills: 20, job_match: 44.8,
      detailed_metrics: { ...basic.detailed_metrics,
        experience: { total_roles: 0, avg_bullets_per_role: 0, quantified_achievements: 0, quantification_rate: 0 },
        skills: { total_skills: 2, categorized_skills: 1, unique_categories: 1 },
      },
    };
    const html = render(score);
    row(html, 'Total Roles', '0'); row(html, 'Avg Bullets/Role', '0.0'); row(html, 'Quantification Rate', '0.0%');
    row(html, 'Total Skills', '2'); row(html, 'Unique Categories', '1');
    assert.match(html, /Job Match/); assert.match(html, /45\/100/); assert.match(html, /0\/100/);
    assert.match(html, /Feedback &amp; Suggestions/);
    assert.doesNotMatch(html, /NaN|undefined|Optimal/);
  });
}

test('absent, null and empty analysis omit details without inventing measurements', () => {
  for (const detailed_metrics of [undefined, null, {}]) {
    const html = render({ ...basic, experience: undefined, skills: undefined, job_match: undefined, detailed_metrics });
    assert.match(html, /ATS Compliance/);
    assert.doesNotMatch(html, /Detailed Metrics|Total Roles|Total Skills|NaN|undefined/);
  }
});

test('partial analyses keep only finite measured rows, including explicit false and zero', () => {
  const html = render({ ...basic, detailed_metrics: {
    readability: { flesch_reading_ease: NaN }, structure: { has_contact: false },
    experience: null, skills: {}, layout: { word_count: 0, estimated_pages: Infinity },
  } });
  row(html, 'Word Count', '0'); row(html, 'Has Contact Info', 'No');
  assert.doesNotMatch(html, /Flesch Reading Ease|Has Summary|Estimated Pages|Total Skills|Total Roles|NaN|Infinity|Optimal/);
});
