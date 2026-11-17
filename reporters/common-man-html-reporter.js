const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CommonManHtmlReporter {
  constructor() {
    this.tests = new Map();
  }

  onTestEnd(test, result) {
    this.tests.set(test.id, {
      title: test.titlePath().join(' › '),
      file: test.location.file,
      line: test.location.line,
      project: test.parent.project()?.name || '',
      expectedStatus: test.expectedStatus,
      status: result.status,
      errors: result.errors.map(error => error.message).filter(Boolean),
    });
  }

  onEnd(result) {
    const resultsDir = path.resolve(__dirname, '..', 'test-results');
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, '.common-man-run.json'), JSON.stringify({
      status: result.status,
      tests: [...this.tests.values()],
    }));

    execFileSync(process.execPath, [path.resolve(__dirname, '..', 'scripts', 'generate-common-report.js')], {
      stdio: 'inherit',
    });
  }
}

module.exports = CommonManHtmlReporter;
