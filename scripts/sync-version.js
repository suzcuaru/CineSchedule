#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Читаем версию из config/appData.ts
const appDataPath = 'config/appData.ts';
const appDataContent = readFileSync(appDataPath, 'utf-8');

// Извлекаем версию с помощью регулярного выражения
const versionMatch = appDataContent.match(/version:\s*"([^"]+)"/);
if (!versionMatch) {
  console.error('❌ Не удалось найти версию в config/appData.ts');
  process.exit(1);
}

const version = versionMatch[1]; // Получаем v3.0.3

// Преобразуем формат v3.0.3 -> 3.0.3
const versionNumber = version.replace('v', '');

console.log(`📦 Найдена версия в config/appData.ts: ${version}`);
console.log(`🔄 Обновляем версию в package.json: ${versionNumber}`);

// Читаем package.json
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Обновляем версию
packageJson.version = versionNumber;

// Записываем обратно в package.json
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ package.json обновлен`);

// Обновляем package-lock.json, выполнив npm install
console.log(`🔄 Обновляем package-lock.json...`);
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log(`✅ package-lock.json обновлен`);
} catch (error) {
  console.error(`❌ Ошибка при обновлении package-lock.json:`, error.message);
  process.exit(1);
}

console.log(`\n✨ Синхронизация версий завершена успешно!`);
console.log(`📌 Версия: ${versionNumber}`);
