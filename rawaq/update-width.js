const fs = require('fs');

const filesToUpdate = [
  'c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/app/[locale]/products/page.tsx',
  'c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/app/[locale]/product/[slug]/page.tsx',
  'c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/app/[locale]/page.tsx',
  'c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/app/[locale]/category/[slug]/page.tsx',
  'c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/components/ui/HeroSlider.tsx',
  'c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/components/layout/Header.tsx',
  'c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/components/layout/Footer.tsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace max-w-7xl with w-full to make it span full screen
    const newContent = content.replace(/max-w-7xl\s+mx-auto/g, 'w-full mx-auto');
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Updated:', file);
    }
  }
});
