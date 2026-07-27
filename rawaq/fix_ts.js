const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

const apiFiles = walk('c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/app/api');
apiFiles.filter(f => f.endsWith('.ts')).forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    if (content.includes('apiSuccess(')) {
        const oldContent = content;
        content = content.replace(/apiSuccess\(([^,]+),\s*\"[^\"]+\"\s*(,\s*\d+)?\)/g, 'apiSuccess($1)');
        if (content !== oldContent) changed = true;
    }
    
    if (content.includes('withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> })')) {
        content = content.replace(/withErrorHandler\(async \(req: NextRequest, \{ params \}: \{ params: Promise<\{ id: string \}> \}\)/g, 'withErrorHandler(async (req: NextRequest, ctx: any)');
        
        if (!content.includes('const { id } = await ctx.params;')) {
             content = content.replace(/const \{ id \} = await params;/g, 'const { id } = await (ctx.params as Promise<{id: string}>);');
        }
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(f, content);
        console.log("Updated", f);
    }
});

const adminFiles = walk('c:/Users/osoma/OneDrive/Desktop/Rawaq/rawaq/app/[locale]/admin');
adminFiles.filter(f => f.endsWith('.tsx')).forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    if (content.includes('isOpen={')) {
        content = content.replace(/isOpen=\{/g, 'open={');
        changed = true;
    }
    
    if (content.includes('variant="success"')) {
        content = content.replace(/variant=\"success\"/g, 'variant="default" className="bg-green-100 text-green-800"');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(f, content);
        console.log("Updated", f);
    }
});
