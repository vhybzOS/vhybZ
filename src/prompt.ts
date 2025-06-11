
import { Prompt, PromptProvider } from './types';
import mustache from 'mustache';
import { extname, basename, join } from 'path';
import { readdir, readFile } from 'fs/promises';
import { sleep } from './utils';

const PROMPTS_PATH = './prompts';

const promptMap: Map<string, string> = new Map();
let ready = false;

export async function loadMarkdown(name: string): Promise<string> {
  while (!ready) {
    await sleep(100);
  }
  const filePath = promptMap.get(name);
  if (!filePath) {
    throw new Error('Prompt file does not exist');
  }

  return await readTextFile(filePath);
}

export async function renderTemplate(name: string, params: Record<string, any>): Promise<string> {
  const template = await loadMarkdown(name);
  return mustache.render(template, params);
}

export const makePrompt: PromptProvider = (name: string) => {
  return (params?: Record<string, any>) => {
    return renderTemplate(name, params || {});
  };
};

export async function getPrompt(promptFn: Prompt, params?: Record<string, any>): Promise<string> {
  if (typeof promptFn === 'string') {
    return promptFn;
  }
  return await promptFn(params);
}

async function listMarkdownFilesAsMap(dirPath: string): Promise<Map<string, string>> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = join(dirPath, entry.name);
        const extension = extname(fullPath);
        if (extension === '.md') {
          const fileNameWithoutExt = basename(entry.name, '.md');
          promptMap.set(fileNameWithoutExt, fullPath);
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Directory not found at ${dirPath}`);
      throw error;
    } else if (error.code === 'EACCES') {
      console.error(`Error: Permission denied to read directory ${dirPath}`);
      throw error;
    } else {
      console.error(`An unexpected error occurred while listing files in ${dirPath}:`, error);
      throw error;
    }
  }
  ready = true;
  return promptMap;
}

async function readTextFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`Error: File not found at ${filePath}`);
      throw error;
    } else if (error.code === 'EACCES') {
      console.error(`Error: Permission denied to read ${filePath}`);
      throw error;
    } else {
      console.error(`An unexpected error occurred while reading ${filePath}:`, error);
      throw error;
    }
  }
}

// Trigger prompt map initialization
listMarkdownFilesAsMap(PROMPTS_PATH);
