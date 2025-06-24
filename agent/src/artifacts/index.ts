import { promises as fs } from 'fs';
import path from 'path';
import { ensureDir, getArtifactPaths } from './utils.ts';
import { ArtifactConfig, StoredArtifact } from './types.ts';

export class ArtifactsModule {
  private readonly baseArtifactsPath: string;

  constructor(config: ArtifactConfig) {
    if (!config.baseArtifactsPath) {
      throw new Error('baseArtifactsPath must be provided in the ArtifactsModule configuration.');
    }
    this.baseArtifactsPath = config.baseArtifactsPath;
    // Ensure the base artifacts path exists when the module is initialized
    ensureDir(this.baseArtifactsPath).catch(err => {
      console.error(`Failed to ensure base artifacts path during initialization: ${err.message}`);
    });
  }

  // --- HTML Operations ---

  /**
   * Stores or updates the HTML content for an artifact.
   * This will create the artifact directory structure if it doesn't exist.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @param htmlContent The HTML content to store.
   */
  public async saveHtml(userId: string, artifactId: string, htmlContent: string): Promise<void> {
    if (!userId || !artifactId || typeof htmlContent !== 'string') {
      throw new Error('userId, artifactId, and htmlContent (string) are required to save HTML.');
    }

    const { artifactPath, htmlFilePath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);

    await ensureDir(artifactPath); // Ensure user/artifact directory
    await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
    console.log(`HTML for artifact ${artifactId} for user ${userId} saved/updated.`);
  }

  /**
   * Retrieves the HTML content for an artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns The HTML content as a string, or null if not found.
   */
  public async getHtml(userId: string, artifactId: string): Promise<string | null> {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to retrieve HTML.');
    }

    const { htmlFilePath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);

    try {
      const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
      return htmlContent;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // HTML file not found
      }
      console.error(`Error retrieving HTML for artifact ${artifactId} for user ${userId}:`, error);
      throw new Error(`Could not retrieve HTML: ${error.message}`);
    }
  }

  /**
   * Deletes the HTML content for an artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns True if HTML was deleted, false if it didn't exist.
   */
  public async deleteHtml(userId: string, artifactId: string): Promise<boolean> {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to delete HTML.');
    }

    const { htmlFilePath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);

    try {
      await fs.unlink(htmlFilePath); // Delete the file
      console.log(`HTML for artifact ${artifactId} for user ${userId} deleted.`);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false; // HTML file not found, nothing to delete
      }
      console.error(`Error deleting HTML for artifact ${artifactId} for user ${userId}:`, error);
      throw new Error(`Could not delete HTML: ${error.message}`);
    }
  }

  // --- Image Operations ---

  /**
   * Adds or updates a single image for an artifact.
   * This will create the artifact and images directory structure if it doesn't exist.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @param filename The name of the image file (e.g., 'my_image.png').
   * @param buffer The Buffer containing the image data.
   */
  public async saveImage(userId: string, artifactId: string, filename: string, buffer: Buffer): Promise<void> {
    if (!userId || !artifactId || !filename || !buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('userId, artifactId, filename, and a valid Buffer are required to save an image.');
    }

    const { imagesDirPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);
    const imagePath = path.join(imagesDirPath, filename);

    await ensureDir(imagesDirPath); // Ensure images sub-directory
    await fs.writeFile(imagePath, buffer);
    console.log(`Image '${filename}' for artifact ${artifactId} for user ${userId} saved/updated.`);
  }

  /**
   * Retrieves the buffer content of a specific image for an artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @param filename The name of the image file to retrieve.
   * @returns The image content as a Buffer, or null if not found.
   */
  public async getImage(userId: string, artifactId: string, filename: string): Promise<Buffer | null> {
    if (!userId || !artifactId || !filename) {
      throw new Error('userId, artifactId, and filename are required to retrieve an image.');
    }

    const { imagesDirPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);
    const imagePath = path.join(imagesDirPath, filename);

    try {
      const imageBuffer = await fs.readFile(imagePath);
      return imageBuffer;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // Image file not found
      }
      console.error(`Error retrieving image '${filename}' for artifact ${artifactId} for user ${userId}:`, error);
      throw new Error(`Could not retrieve image: ${error.message}`);
    }
  }

  /**
   * Lists all image filenames for a specific artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns An array of image filenames (e.g., ['image1.png', 'image2.jpg']), or an empty array if no images or directory exists.
   */
  public async listImages(userId: string, artifactId: string): Promise<string[]> {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to list images.');
    }

    const { imagesDirPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);

    try {
      const imageDirents = await fs.readdir(imagesDirPath, { withFileTypes: true });
      return imageDirents
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // Images directory doesn't exist, so no images
      }
      console.warn(`Could not list images for artifact ${artifactId} for user ${userId}:`, error);
      throw new Error(`Could not list images: ${error.message}`);
    }
  }

  /**
   * Deletes a specific image file for an artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @param filename The name of the image file to delete.
   * @returns True if the image was deleted, false if it didn't exist.
   */
  public async deleteImage(userId: string, artifactId: string, filename: string): Promise<boolean> {
    if (!userId || !artifactId || !filename) {
      throw new Error('userId, artifactId, and filename are required to delete an image.');
    }

    const { imagesDirPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);
    const imagePath = path.join(imagesDirPath, filename);

    try {
      await fs.unlink(imagePath); // Delete the specific image file
      console.log(`Image '${filename}' for artifact ${artifactId} for user ${userId} deleted.`);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false; // Image file not found, nothing to delete
      }
      console.error(`Error deleting image '${filename}' for artifact ${artifactId} for user ${userId}:`, error);
      throw new Error(`Could not delete image: ${error.message}`);
    }
  }

  /**
   * Deletes ALL images for a specific artifact by removing the 'images' directory.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns True if the images directory was deleted, false if it didn't exist.
   */
  public async deleteAllImages(userId: string, artifactId: string): Promise<boolean> {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to delete all images.');
    }

    const { imagesDirPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);

    try {
      // Use recursive: true to delete the directory and its contents
      await fs.rm(imagesDirPath, { recursive: true, force: true });
      console.log(`All images for artifact ${artifactId} for user ${userId} deleted.`);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false; // Images directory not found, nothing to delete
      }
      console.error(`Error deleting all images for artifact ${artifactId} for user ${userId}:`, error);
      throw new Error(`Could not delete all images: ${error.message}`);
    }
  }

  // --- Convenience / Combined Operations (Original methods, now using new granular methods) ---

  /**
   * Stores an HTML artifact and optional image files for a user.
   * This is a convenience method that combines saveHtml and saveImage operations.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @param htmlContent The HTML content to store.
   * @param imageBuffers An array of objects containing image filename and its buffer.
   * @returns Information about the stored artifact.
   */
  public async storeArtifact(
    userId: string,
    artifactId: string,
    htmlContent: string,
    imageBuffers: { filename: string; buffer: Buffer }[] = []
  ): Promise<StoredArtifact> {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to store an artifact.');
    }
    if (!htmlContent && imageBuffers.length === 0) {
      throw new Error('Either htmlContent or at least one imageBuffer is required to store an artifact.');
    }

    if (htmlContent) {
      await this.saveHtml(userId, artifactId, htmlContent);
    }

    const storedImageFilenames: string[] = [];
    for (const image of imageBuffers) {
      await this.saveImage(userId, artifactId, image.filename, image.buffer);
      storedImageFilenames.push(image.filename);
    }

    console.log(`Artifact ${artifactId} for user ${userId} stored successfully via combined method.`);

    return {
      userId,
      artifactId,
      htmlContent,
      imageFiles: storedImageFilenames,
    };
  }

  /**
   * Retrieves an HTML artifact and a list of its associated image files.
   * This is a convenience method that combines getHtml and listImages operations.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns An object containing the HTML content and an array of image filenames, or null if nothing is found for the artifact.
   */
  public async getArtifact(userId: string, artifactId: string): Promise<StoredArtifact | null> {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to retrieve an artifact.');
    }

    const htmlContent = await this.getHtml(userId, artifactId);
    const imageFiles = await this.listImages(userId, artifactId);

    if (!htmlContent && imageFiles.length === 0) {
      return null; // Neither HTML nor images found for this artifact
    }

    return {
      userId,
      artifactId,
      htmlContent: htmlContent || undefined, // Set to undefined if null for cleaner object
      imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
    };
  }

  /**
   * Deletes an artifact (HTML and all associated images) for a user.
   * This is a convenience method that combines deleteHtml and deleteAllImages operations,
   * then attempts to remove the artifact's root directory if it's empty.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns True if the artifact (or parts of it) was deleted, false if it didn't exist at all.
   */
  public async deleteArtifact(userId: string, artifactId: string): Promise<boolean> {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to delete an artifact.');
    }

    const { artifactPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);

    let deletedHtml = await this.deleteHtml(userId, artifactId);
    let deletedImages = await this.deleteAllImages(userId, artifactId);

    // Attempt to remove the artifact directory if it's now empty
    try {
      await fs.rmdir(artifactPath);
      console.log(`Artifact directory ${artifactPath} removed as it was empty.`);
      return true; // Directory and contents deleted
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false; // Artifact path didn't exist
      }
      if (error.code === 'ENOTEMPTY') {
        console.log(`Artifact directory ${artifactPath} not empty, leaving it.`);
        return (deletedHtml || deletedImages); // Return true if at least HTML or images were deleted
      }
      console.error(`Error attempting to remove artifact directory ${artifactPath}:`, error);
      throw new Error(`Could not finalize artifact deletion: ${error.message}`);
    }
  }

  /**
   * Provides the full file system path to the HTML file of an artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns The full file path to the HTML file.
   */
  public getHtmlFilePath(userId: string, artifactId: string): string {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to get HTML file path.');
    }
    const { htmlFilePath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);
    return htmlFilePath;
  }

  /**
   * Provides the full file system path to the images directory of an artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @returns The full file path to the images directory.
   */
  public getImagesDirPath(userId: string, artifactId: string): string {
    if (!userId || !artifactId) {
      throw new Error('userId and artifactId are required to get images directory path.');
    }
    const { imagesDirPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);
    return imagesDirPath;
  }

  /**
   * Provides the full file system path to a specific image file of an artifact.
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact.
   * @param filename The name of the image file.
   * @returns The full file path to the image file.
   */
  public getImageFilePath(userId: string, artifactId: string, filename: string): string {
    if (!userId || !artifactId || !filename) {
      throw new Error('userId, artifactId, and filename are required to get image file path.');
    }
    const { imagesDirPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);
    return path.join(imagesDirPath, filename);
  }


  /**
   * Provides the full file system path to any file within an artifact's directory.
   * This is designed for serving static files via a web server.
   * It includes a security check to prevent path traversal.
   *
   * @param userId The ID of the user.
   * @param artifactId The ID of the artifact (or threadId).
   * @param relativeFilePath The path to the file relative to the artifact's directory
   * (e.g., 'index.html', 'images/my_image.png', 'style.css').
   * @returns The full absolute file system path.
   * @throws Error if userId, artifactId, or relativeFilePath are missing.
   * @throws Error if path traversal is detected.
  */
  public getArtifactFileAbsolutePath(userId: string, artifactId: string, relativeFilePath: string): string {
    if (!userId || !artifactId || !relativeFilePath) {
      throw new Error('userId, artifactId, and relativeFilePath are required to get an artifact file path.');
    }

    const { artifactPath } = getArtifactPaths(this.baseArtifactsPath, userId, artifactId);

    // Ensure the artifactPath exists before joining, as `path.join` doesn't validate existence.
    // We're not doing an fs.access here for performance, but the serving layer should handle ENOENT.

    // Construct the full path using path.join for cross-platform compatibility
    const fullPath = path.join(artifactPath, relativeFilePath);

    // --- SECURITY CHECK: Prevent Path Traversal ---
    // 1. Resolve the full path to normalize it (e.g., remove '..' segments)
    const resolvedPath = path.resolve(fullPath);
    // 2. Resolve the base artifact directory path
    const resolvedArtifactPath = path.resolve(artifactPath);

    // 3. Check if the resolved file path starts with the resolved artifact directory path.
    //    Also, ensure it's not just the artifact directory itself (unless relativeFilePath is empty/'.')
    //    `path.sep` ensures it matches a subdirectory, not just a prefix (e.g., /user/artifacts vs /user/artifactssomething)
    if (!resolvedPath.startsWith(resolvedArtifactPath + path.sep) && resolvedPath !== resolvedArtifactPath) {
      throw new Error(`Path traversal attempt detected for file: ${relativeFilePath}. Resolved path: ${resolvedPath}`);
    }
    // If relativeFilePath was just '.', it would resolve to resolvedArtifactPath, which is fine.
    // If it was 'index.html', it should be resolvedArtifactPath/index.html.

    return fullPath;
  }
}
