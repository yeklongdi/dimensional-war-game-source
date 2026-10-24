import * as fs from 'node:fs';
import { codeRoot, resolve } from './project-paths.mjs';

// 历史阶段审计仍使用当时的文件名及哈希，只在文件IO边界转换现位置。
const filePath = file => typeof file === 'string' ? resolve(codeRoot, file) : file;
export const readFileSync = (file, ...args) => fs.readFileSync(filePath(file), ...args);
export const writeFileSync = (file, ...args) => fs.writeFileSync(filePath(file), ...args);
export const existsSync = file => fs.existsSync(filePath(file));
export const mkdirSync = (file, ...args) => fs.mkdirSync(filePath(file), ...args);
export const readdirSync = (file, ...args) => fs.readdirSync(filePath(file), ...args);
