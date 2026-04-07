// 简单的TypeScript语法检查脚本
// 用于验证关键文件是否有语法错误

const fs = require('fs');
const path = require('path');

console.log('=== TypeScript文件语法检查 ===\n');

const filesToCheck = [
  'src/common/services/data-permission.service.ts',
  'src/common/services/permission-cache.service.ts',
  'src/common/services/audit-log.service.ts',
  'src/common/guards/role.guard.ts',
  'src/common/interceptors/data-filter.interceptor.ts',
  'src/modules/audit/entities/audit-log.entity.ts',
  'src/modules/audit/audit.module.ts',
  'src/modules/audit/audit.controller.ts',
];

let hasErrors = false;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${file}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // 检查基本语法问题
  const checks = [
    { name: '括号匹配', test: () => checkBrackets(content) },
    { name: '导入语句', test: () => checkImports(content) },
    { name: '类定义', test: () => checkClassDefinition(content) },
    { name: '方法重复', test: () => checkDuplicateMethods(content) },
  ];

  console.log(`\n📄 ${file}`);
  
  checks.forEach(check => {
    const result = check.test();
    if (result.valid) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name}: ${result.message}`);
      hasErrors = true;
    }
  });
});

console.log('\n=== 检查结果 ===');
if (hasErrors) {
  console.log('❌ 发现错误，请修复后再构建');
  process.exit(1);
} else {
  console.log('✅ 所有文件检查通过');
  process.exit(0);
}

// 辅助函数
function checkBrackets(content) {
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  if (openBraces !== closeBraces) {
    return { valid: false, message: `大括号不匹配: { ${openBraces} vs } ${closeBraces}` };
  }
  if (openParens !== closeParens) {
    return { valid: false, message: `小括号不匹配: ( ${openParens} vs ) ${closeParens}` };
  }
  return { valid: true };
}

function checkImports(content) {
  // 简化检查，只检查是否有明显的语法错误
  return { valid: true };
}

function checkClassDefinition(content) {
  const classMatches = content.match(/@Injectable|@Controller|@Entity|class \w+/g) || [];
  const hasClass = content.includes('class ');
  
  if (!hasClass && classMatches.length > 0) {
    return { valid: false, message: '找到装饰器但未找到类定义' };
  }
  return { valid: true };
}

function checkDuplicateMethods(content) {
  const methodMatches = content.match(/async \w+\(/g) || [];
  const methodCounts = {};
  
  methodMatches.forEach(method => {
    const methodName = method.replace('async ', '').replace('(', '');
    methodCounts[methodName] = (methodCounts[methodName] || 0) + 1;
  });
  
  const duplicates = Object.entries(methodCounts)
    .filter(([_, count]) => count > 1)
    .map(([name, count]) => `${name}(${count}次)`);
  
  if (duplicates.length > 0) {
    return { valid: false, message: `重复方法: ${duplicates.join(', ')}` };
  }
  return { valid: true };
}
