// API service for DiffReviewer
import type {
  DiffFile,
  SaveFileRequest,
  SaveFileResponse,
  ShutdownRequest,
  ShutdownResponse,
} from '../types';

/**
 * Fetches diff between branches specified at CLI startup
 */
export async function fetchDiff(): Promise<DiffFile[]> {
  try {
    const response = await fetch('./api/diff');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch diff: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching diff:', error);
    throw error;
  }
}

/**
 * Fetches file content by git hash
 */
export async function fetchFileContent(hash: string): Promise<string> {
  try {
    if (!hash || hash === '0000000000000000000000000000000000000000') {
      console.warn('Invalid file hash, returning empty string');
      return '';
    }
    
    const url = `./api/file-content?hash=${encodeURIComponent(hash)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
}

/**
 * Saves edited file content back to working directory
 */
export async function saveFileContent(
  path: string,
  content: string
): Promise<SaveFileResponse> {
  try {
    const request: SaveFileRequest = { path, content };
    const response = await fetch('./api/save-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to save file: ${response.statusText} - ${errorText}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving file content:', error);
    throw error;
  }
}

/**
 * Triggers graceful shutdown with final general notes
 */
export async function shutdown(
  generalNotes: string
): Promise<ShutdownResponse> {
  try {
    const request: ShutdownRequest = { generalNotes };
    const response = await fetch('./api/shutdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to shutdown: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error during shutdown:', error);
    throw error;
  }
}
