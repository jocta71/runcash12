const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to remove
const dirsToRemove = [
  'api',
  'scraper',
  'src',
  'src - newversion',
  'public',
  'examples',
  'supabase',
  '__pycache__'
];

// Function to safely remove a directory
function removeDir(dir) {
  try {
    console.log(`Removing directory: ${dir}`);
    
    // Use rimraf-like approach for Windows compatibility
    if (process.platform === 'win32') {
      // Add /f for force
      execSync(`rmdir /s /q /f "${dir}"`, { stdio: 'inherit' });
    } else {
      execSync(`rm -rf "${dir}"`, { stdio: 'inherit' });
    }
    
    console.log(`Successfully removed: ${dir}`);
  } catch (error) {
    console.error(`Error removing ${dir}:`, error.message);
    
    // Try an alternative method for Windows if the first one fails
    if (process.platform === 'win32') {
      try {
        console.log(`Trying alternative method for: ${dir}`);
        // Use PowerShell's Remove-Item with -Force
        execSync(`powershell -Command "Remove-Item -Path '${dir}' -Recurse -Force"`, { stdio: 'inherit' });
        console.log(`Successfully removed using alternative method: ${dir}`);
      } catch (altError) {
        console.error(`Alternative method also failed for ${dir}:`, altError.message);
      }
    }
  }
}

// Main cleanup function
function cleanup() {
  console.log('Starting cleanup process...');
  
  dirsToRemove.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    
    // Check if directory exists before attempting to remove
    if (fs.existsSync(dirPath)) {
      removeDir(dirPath);
    } else {
      console.log(`Directory not found, skipping: ${dir}`);
    }
  });
  
  console.log('Cleanup complete!');
}

// Run the cleanup
cleanup(); 