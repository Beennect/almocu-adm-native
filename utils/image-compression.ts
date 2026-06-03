import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

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

/**
 * Obtém o tamanho do arquivo de forma cross-platform.
 * - Nativo: usa expo-file-system
 * - Web: busca o blob e lê o size (fallback)
 */
const getFileSize = async (uri: string): Promise<number> => {
  if (Platform.OS === 'web') {
    try {
      const response = await fetch(uri, { method: 'HEAD' });
      const length = response.headers.get('content-length');
      if (length) return parseInt(length, 10);
    } catch {
      // fallback: tenta buscar o blob completo
      try {
        const blobResp = await fetch(uri);
        const blob = await blobResp.blob();
        return blob.size;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  // Nativo (Android / iOS)
  try {
    const FileSystem = await import('expo-file-system');
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (!info.exists) return 0;
    return (info as any).size ?? 0;
  } catch {
    return 0;
  }
};

/**
 * Lê um arquivo de imagem como Data URI (base64) de forma cross-platform.
 */
export async function readFileAsBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler imagem como base64'));
      reader.readAsDataURL(blob);
    });
  }

  // Nativo (Android / iOS)
  const FileSystem = await import('expo-file-system');
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  // Determina o MIME type pela extensão
  const ext = (uri.match(/\.(\w+)(?:\?.*)?$/) || [])[1]?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp',
  };
  return `data:${mimeMap[ext] || 'image/jpeg'};base64,${base64}`;
}

export interface CompressResult {
  uri: string;
  size: number;
  width: number;
  height: number;
  passesApplied: number;
  /** Data URI da imagem (data:image/...;base64,XXXX) — para enviar no JSON */
  base64: string;
}

export async function compressImageForUpload(uri: string): Promise<CompressResult> {
  let currentUri = uri;
  let currentSize = await getFileSize(uri);
  let lastResult: ImageManipulator.ImageResult | null = null;
  let passesApplied = 0;

  for (const pass of COMPRESSION_PASSES) {
    if (currentSize > 0 && currentSize <= MAX_SIZE_BYTES) break;
    if (passesApplied > 0 && pass.width <= MIN_WIDTH && pass.quality <= MIN_QUALITY) break;

    try {
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ resize: { width: pass.width } }],
        { compress: pass.quality, format: ImageManipulator.SaveFormat.JPEG },
      );

      lastResult = result;
      passesApplied += 1;
      currentUri = result.uri;
      currentSize = await getFileSize(result.uri);
    } catch {
      // Se o manipulateAsync falhar (ex.: web sem suporte completo),
      // interrompe a compressão e usa a URI atual
      break;
    }
  }

  if (!lastResult) {
    try {
      const info = await ImageManipulator.manipulateAsync(uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });
      lastResult = info;
      currentUri = info.uri;
      currentSize = await getFileSize(info.uri);
    } catch {
      // Fallback absoluto: retorna com base64 mesmo sem compressão
      const base64 = await readFileAsBase64(uri).catch(() => '');
      return { uri, size: 0, width: 0, height: 0, passesApplied: 0, base64 };
    }
  }

  // Lê a imagem final como base64 para enviar no JSON
  let base64 = '';
  try {
    base64 = await readFileAsBase64(currentUri);
  } catch {
    // base64 vazio significa "sem imagem"
  }

  return {
    uri: currentUri,
    size: currentSize,
    width: lastResult.width,
    height: lastResult.height,
    passesApplied,
    base64,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const IMAGE_UPLOAD_MAX_BYTES = MAX_SIZE_BYTES;
