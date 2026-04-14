const fs = require('fs');
const path = require('path');

const targetDir = path.join('e:', 'Repos', 'Major-II', 'client', 'components');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(targetDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  // Find instances of SafeAreaView inside react-native imports
  // e.g. import { View, SafeAreaView, Text } from 'react-native';
  const importRegex = /import\s+{([^}]*?SafeAreaView[^}]*?)}\s+from\s+['"]react-native['"];/g;
  
  content = content.replace(importRegex, (match, p1) => {
    // Remove SafeAreaView from the list
    const parts = p1.split(',').map(s => s.trim()).filter(Boolean);
    const newParts = parts.filter(p => !p.includes('SafeAreaView'));
    
    let newImport = '';
    hasChanges = true;
    
    // Add safe area context import at the top later
    
    if (newParts.length > 0) {
      return `import { ${newParts.join(', ')} } from "react-native";`;
    } else {
      return ''; // Entire import is just SafeAreaView
    }
  });

  if (hasChanges) {
    // Check if it already has react-native-safe-area-context
    if (!content.includes('react-native-safe-area-context')) {
      content = `import { SafeAreaView } from "react-native-safe-area-context";\n` + content;
    } else if (!content.includes('SafeAreaView') || content.match(/import\s*{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native-safe-area-context['"]/)) {
      // It has the import, just ensure SafeAreaView is listed
      if (!/import.*SafeAreaView.*from.*react-native-safe-area-context/.test(content)) {
          content = content.replace(/(import\s*{)([^}]*)(}\s+from\s+['"]react-native-safe-area-context['"])/, function(match, p1, p2, p3) {
            const inner = p2.trim();
            if (inner) return `${p1} SafeAreaView, ${inner} ${p3}`;
             return `${p1} SafeAreaView ${p3}`;
          });
      }
    }
    fs.writeFileSync(file, content, 'utf8');
  }
});
