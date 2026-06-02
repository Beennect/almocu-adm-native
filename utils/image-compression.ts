import * as ImageManipulator from 'expo-image-manipulator';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_WIDTH = 600;
const MIN_QUALITY = 0.3;

interface CompressionPass {
  width: number;
  quality: number;
}

const COMPRESSION_PASSES: CompressionPass[] = [
  { width: 1280, quality: 0.7 },
  { width: 1024, quality: 0.55 },
  { width: 800, quality: 0.4 },
  { width: MIN_WIDTH, quality: MIN_QUALITY },
];

const getFileSize = async (uri: string): Promise<number> => {
  const FileSystem = await import('expo-file-system');
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (!info.exists) return 0;
  return (info as any).size ?? 0;
};

export interface CompressResult {
  uri: string;
  size: number;
  width: number;
  height: number;
  passesApplied: number;
}

export async function compressImageForUpload(uri: string): Promise<CompressResult> {
  let currentUri = uri;
  let currentSize = await getFileSize(uri);
  let lastResult: ImageManipulator.ImageResult | null = null;
  let passesApplied = 0;

  for (const pass of COMPRESSION_PASSES) {
    if (currentSize > 0 && currentSize <= MAX_SIZE_BYTES) break;
    if (passesApplied > 0 && pass.width <= MIN_WIDTH && pass.quality <= MIN_QUALITY) break;

    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: pass.width } }],
      { compress: pass.quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    lastResult = result;
    passesApplied += 1;
    currentUri = result.uri;
    currentSize = await getFileSize(result.uri);
  }

  if (!lastResult) {
    const info = await ImageManipulator.manipulateAsync(uri, [], { format: ImageManipulator.SaveFormat.JPEG });
    lastResult = info;
    currentUri = info.uri;
    currentSize = await getFileSize(info.uri);
  }

  return {
    uri: currentUri,
    size: currentSize,
    width: lastResult.width,
    height: lastResult.height,
    passesApplied,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const IMAGE_UPLOAD_MAX_BYTES = MAX_SIZE_BYTES;
