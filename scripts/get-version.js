const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get the last commit date using git log
  const commitDate = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim();
  
  // Format: "2025-12-10 09:58:36 -0600" -> "2025-12-10 09:58:36"
  // Remove timezone offset
  const formattedDate = commitDate.split(' ').slice(0, 2).join(' ');
  
  // Create version object
  const version = {
    lastUpdated: formattedDate,
  };
  
  // Write to lib/version.json
  const versionPath = path.join(__dirname, '..', 'lib', 'version.json');
  fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
  
  console.log(`Version file created: ${formattedDate}`);
} catch (error) {
  // Handle cases where git might not be available (e.g., CI/CD, no git repo)
  console.warn('Could not get git commit date:', error.message);
  
  // Create a fallback version file with current date
  const fallbackDate = new Date().toISOString().replace('T', ' ').split('.')[0];
  const version = {
    lastUpdated: fallbackDate,
  };
  
  const versionPath = path.join(__dirname, '..', 'lib', 'version.json');
  fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
  
  console.log(`Version file created with fallback date: ${fallbackDate}`);
}









