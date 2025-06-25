import { Hono } from "hono";
import { ArtifactsModule } from "artifacts/index.ts";
import { readFileSync, promises as fsPromises } from 'fs';
import mime from 'mime-types';

export const app = new Hono();

// Initialize the ArtifactsModule
const artifactsBasePath = process.env.ARTIFACTS_PATH || './data/artifacts'; // Default to ./data/artifacts
const artifactsModule = new ArtifactsModule({ baseArtifactsPath: artifactsBasePath });

// Route to serve artifact files: /artifacts/:userId/:threadId/*
// The `*` captures the rest of the path after :threadId
app.get('/artifacts/:userId/:threadId/*', async (c) => {
  const userId = c.req.param('userId');
  const threadId = c.req.param('threadId');
  // Get the wildcard path, which is the relative path within the artifact directory
  const relativeFilePath = c.req.path.split(threadId + '/').at(-1); // Remove '/artifacts/:userId/:threadId/' parts

  if (!userId || !threadId || !relativeFilePath) {
    return c.text(`Invalid request: Missing user ID, thread ID, or file path. ${userId} ${threadId} ${relativeFilePath}`, 400);
  }

  let absoluteFilePath: string;
  try {
    // Use the new safe method from ArtifactsModule to get the absolute path
    absoluteFilePath = artifactsModule.getArtifactFileAbsolutePath(userId, threadId, relativeFilePath);
  } catch (error: any) {
    console.error(`Security or path error for ${userId}/${threadId}/${relativeFilePath}:`, error.message);
    return c.text('Bad Request or Security Violation.', 400); // Or 403 Forbidden
  }

  try {
    // Check if the file exists
    await fsPromises.access(absoluteFilePath, fsPromises.constants.F_OK);

    // Read the file content
    const fileContent = await fsPromises.readFile(absoluteFilePath);

    // Determine content type based on file extension
    const contentType = mime.lookup(absoluteFilePath) || 'application/octet-stream';

    // Set Content-Type header and return the file content
    c.header('Content-Type', contentType);
    // Optional: Add Cache-Control headers for better performance
    c.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return c.body(fileContent);

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`File not found: ${absoluteFilePath}`);
      return c.text('Not Found', 404);
    } else {
      console.error(`Error serving file ${absoluteFilePath}:`, error);
      return c.text('Internal Server Error', 500);
    }
  }
});

app.get("/hello", (c) => c.json({ hello: "world" }));
