import path from 'path';
import fs from 'fs/promises';
import { ArtifactPaths } from './types.ts';

/**
 * Ensures a directory exists. If it doesn't, it creates it recursively.
 * @param dirPath The path to the directory to ensure.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // EXIST means the directory already exists, which is fine.
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      console.error(`Failed to create directory ${dirPath}:`, error);
      throw new Error(`Could not create directory: ${dirPath}`);
    }
  }
}

/**
 * Generates all relevant paths for a given user and artifact.
 * @param baseArtifactsPath The base path for all artifacts.
 * @param userId The ID of the user.
 * @param artifactId The ID of the artifact.
 * @returns An ArtifactPaths object containing all derived paths.
 */
export function getArtifactPaths(baseArtifactsPath: string, userId: string, artifactId: string): ArtifactPaths {
  const basePath = baseArtifactsPath;
  const userPath = path.join(basePath, userId);
  const artifactPath = path.join(userPath, artifactId);
  const htmlFilePath = path.join(artifactPath, 'index.html'); // Standard name for HTML
  const imagesDirPath = path.join(artifactPath, 'images'); // Subfolder for images

  return {
    basePath,
    userPath,
    artifactPath,
    htmlFilePath,
    imagesDirPath,
  };
}
