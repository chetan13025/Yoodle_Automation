const { execFileSync } = require('child_process');
const path = require('path');

class BeautifulHtmlReporter {
  onEnd() {
    execFileSync(process.execPath, [path.resolve(__dirname, '..', 'scripts', 'generate-beautiful-report.js')], {
      stdio: 'inherit',
    });
  }
}

module.exports = BeautifulHtmlReporter;
