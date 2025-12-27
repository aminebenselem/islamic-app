// Web Worker: Fetch and parse surah JSON, then stream ayahs in batches

interface SurahDetailRaw {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
  surahNo?: number;
  english: string[];
  arabic1: string[];
  audio: any;
}

const BATCH_SIZE = 25; // worker-side batch size

self.onmessage = async (e: MessageEvent) => {
  const { surahNo } = e.data || {};
  if (!surahNo) {
    (self as any).postMessage({ type: 'error', error: 'No surahNo provided' });
    return;
  }
  try {
    const response = await fetch(`https://quranapi.pages.dev/api/${surahNo}.json`);
    const text = await response.text();
    // Parse JSON (heavy) in worker thread
    const detail: SurahDetailRaw = JSON.parse(text);

    // Send meta first (without big arrays)
    (self as any).postMessage({
      type: 'meta',
      meta: {
        surahName: detail.surahName,
        surahNameArabic: detail.surahNameArabic,
        surahNameArabicLong: detail.surahNameArabicLong,
        surahNameTranslation: detail.surahNameTranslation,
        revelationPlace: detail.revelationPlace,
        totalAyah: detail.totalAyah,
        surahNo: detail.surahNo
      }
    });

    const total = detail.arabic1.length;
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const arabicBatch = detail.arabic1.slice(i, i + BATCH_SIZE);
      const englishBatch = detail.english.slice(i, i + BATCH_SIZE);
      (self as any).postMessage({
        type: 'batch',
        arabic: arabicBatch,
        english: englishBatch,
        done: i + BATCH_SIZE >= total
      });
      // Yield between batches so main thread can paint
      await new Promise(r => setTimeout(r, 5));
    }
    (self as any).postMessage({ type: 'done' });
  } catch (err: any) {
    (self as any).postMessage({ type: 'error', error: err?.message || 'Worker fetch failed' });
  }
};
