import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertUrlToDataUrl } from '../shared';

const TRANSPARENT_PIXEL_FALLBACK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Helper to stub global FileReader with custom behavior per test
function stubFileReader(impl: {
  readAsDataURL: (this: FileReader, blob: Blob) => void;
}) {
  class MockFileReader implements Partial<FileReader> {
    public result: string | ArrayBuffer | null = null;
    public onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
    public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;

    readAsDataURL(blob: Blob) {
      impl.readAsDataURL.call(this as unknown as FileReader, blob);
    }
  }

  vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader);
}

describe('convertUrlToDataUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the input when URL is already a data URL', async () => {
    const dataUrl = 'data:image/png;base64,AAA';

    const result = await convertUrlToDataUrl(dataUrl);

    expect(result).toBe(dataUrl);
  });

  it('converts a regular HTTP URL to a data URL using fetch + FileReader (happy path)', async () => {
    const blob = new Blob(['dummy'], { type: 'image/png' });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => blob,
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    stubFileReader({
      readAsDataURL(this: FileReader, blob: Blob) {
        void blob;
        // Simulate successful read
        // @ts-expect-error - result is writable here
        this.result = 'data:image/png;base64,TEST';
        this.onloadend?.(new ProgressEvent('loadend') as ProgressEvent<FileReader>);
      },
    });

    const result = await convertUrlToDataUrl('https://example.com/image.png');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe('data:image/png;base64,TEST');
  });

  it('returns transparent pixel fallback when fetch returns a non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      blob: async () => new Blob(['dummy'], { type: 'image/png' }),
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const result = await convertUrlToDataUrl('https://example.com/broken.png');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(TRANSPARENT_PIXEL_FALLBACK);
  });

  it('returns transparent pixel fallback when FileReader fails', async () => {
    const blob = new Blob(['dummy'], { type: 'image/png' });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => blob,
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    // Simulate FileReader error path
    stubFileReader({
      readAsDataURL(this: FileReader, blob: Blob) {
        void blob;
        this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
      },
    });

    const result = await convertUrlToDataUrl('https://example.com/image.png');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(TRANSPARENT_PIXEL_FALLBACK);
  });
});
