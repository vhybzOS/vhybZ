export interface ArtifactPaths {
  basePath: string;
  userPath: string;
  artifactPath: string;
  htmlFilePath: string;
  imagesDirPath: string;
}

export interface StoredArtifact {
  userId: string;
  artifactId: string;
  htmlContent?: string; // Make optional as you might only get images
  imageFiles?: string[]; // Make optional
}

export interface ArtifactConfig {
  baseArtifactsPath: string;
}
