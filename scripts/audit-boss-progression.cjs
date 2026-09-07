const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')

const bossSource = fs.readFileSync('lib/bossLab.ts', 'utf8')
const compiled = ts.transpileModule(bossSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const moduleBox = { exports: {} }
vm.runInNewContext(compiled, { module: moduleBox, exports: moduleBox.exports, require })
const { BOSS_PASS_PERCENT, BOSS_COOLDOWN_HOURS, BOSS_REQUIRED_STREAK_DAYS, SUBJECT_BOSSES } = moduleBox.exports

assert.equal(BOSS_PASS_PERCENT, 80)
assert.equal(BOSS_COOLDOWN_HOURS, 24)
assert.equal(BOSS_REQUIRED_STREAK_DAYS, 12)
assert.equal(SUBJECT_BOSSES.length, 5)

const expectedSubjects = ['math', 'spanish', 'english', 'geography_history', 'biology_geology']
assert.deepEqual(Array.from(SUBJECT_BOSSES, (boss) => boss.subjectId), expectedSubjects)
for (const boss of SUBJECT_BOSSES) {
  assert.equal(boss.questions.length, 15, `${boss.subjectId} must have 15 questions`)
  for (const question of boss.questions) {
    assert.equal(question.options.length, 4, `${boss.subjectId} question must have 4 options`)
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer <= 3, `${boss.subjectId} answer index out of range`)
  }
}

const hardeningSql = fs.readFileSync('database/migrations/20260907112500_harden_quarter_boss_completion.sql', 'utf8')
assert.match(hardeningSql, /coalesce\(array_length\(p_answers, 1\), 0\) <> 15/i)
assert.match(hardeningSql, /answer is null or answer < 0 or answer > 3/i)
assert.match(hardeningSql, /v_passed := v_percent >= 80/i)
assert.match(hardeningSql, /interval '24 hours'/i)
assert.match(hardeningSql, /grant execute[\s\S]*to authenticated/i)

const statusSql = fs.readFileSync('database/migrations/20260906223000_add_quarter_boss_progression.sql', 'utf8')
assert.match(statusSql, /v_streak >= 12/i)
assert.match(statusSql, /required_streak_days', 12/i)

console.log('Ultimate Boss regression audit passed.')
