// quran.page.ts - OPTIMIZED WITH VIRTUAL SCROLLING
import { Component, OnInit, NgZone, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SupabaseService } from '../services/supabase';
import { ThemeService } from '../services/theme.service';

interface Surah {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
  surahNo?: number;
}

interface SurahDetail extends Surah {
  english: string[];
  arabic1: string[];
  audio: any;
}

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit, OnDestroy {
  surahs: Surah[] = [];
  filteredSurahs: Surah[] = [];
  selectedSurah: SurahDetail | null = null;
  searchQuery: string = '';
  loading: boolean = true;
  currentView: 'list' | 'detail' = 'list';
  memorizedSurahs: Set<number> = new Set();
  totalAyahsInQuran = 6236;
  
  audioElement: HTMLAudioElement | null = null;
  currentPlayingAyah: number | null = null;
  selectedReciter: string = '1';
  isPlayingSurah: boolean = false;
  showReciterList: boolean = false;
  surahLoading: boolean = false;
  pageLoading: boolean = false;
  
  reciters = [
    { id: '1', name: 'Mishary Rashid Al Afasy', nameArabic: 'مشاري راشد العفاسي' },
    { id: '2', name: 'Abu Bakr Al Shatri', nameArabic: 'أبو بكر الشاطري' },
    { id: '3', name: 'Nasser Al Qatami', nameArabic: 'ناصر القطامي' },
    { id: '4', name: 'Yasser Al Dosari', nameArabic: 'ياسر الدوسري' },
    { id: '5', name: 'Hani Ar Rifai', nameArabic: 'هاني الرفاعي' }
  ];
  
  viewMode: 'ayah' | 'page' = 'ayah';
  pageData: any = null;
  currentPage: number = 1;
  jumpToAyahNumber: number | null = null;
  jumpToPageNumber: number | null = null;
  basmalaCharCount: number | null = null;
  pageFontSizePx: number = 24;
  
  // VIRTUAL SCROLLING - only render visible ayahs
  visibleAyahCount: number = 0;
  ayahRendering: boolean = false;
  private virtualScrollObserver: IntersectionObserver | null = null;
  private renderBatchSize: number = 20; // Start with 20 ayahs
  private renderTimer: any = null;

  // Cache for performance
  private surahCache = new Map<number, SurahDetail>();
  private pageCache = new Map<number, any>();

  private readonly BASMALA_VARIANTS: string[] = [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    'بسم الله الرحمن الرحيم',
    '﷽'
  ];

  private readonly PAGE_MAP: ReadonlyMap<number, number> = new Map([
    [1, 1], [2, 2], [3, 50], [4, 77], [5, 106], [6, 128], [7, 151], [8, 177], [9, 187],
    [10, 208], [11, 221], [12, 235], [13, 249], [14, 255], [15, 262], [16, 267],
    [17, 282], [18, 293], [19, 305], [20, 312], [21, 322], [22, 332], [23, 342],
    [24, 350], [25, 359], [26, 367], [27, 377], [28, 385], [29, 396], [30, 404],
    [31, 411], [32, 415], [33, 418], [34, 428], [35, 434], [36, 440], [37, 446],
    [38, 453], [39, 458], [40, 467], [41, 477], [42, 483], [43, 489], [44, 496],
    [45, 499], [46, 502], [47, 507], [48, 511], [49, 515], [50, 518], [51, 520],
    [52, 523], [53, 526], [54, 528], [55, 531], [56, 534], [57, 537], [58, 542],
    [59, 545], [60, 549], [61, 551], [62, 553], [63, 554], [64, 556], [65, 558],
    [66, 560], [67, 562], [68, 564], [69, 566], [70, 568], [71, 570], [72, 572],
    [73, 574], [74, 575], [75, 577], [76, 578], [77, 580], [78, 582], [79, 583],
    [80, 585], [81, 586], [82, 587], [83, 587], [84, 589], [85, 590], [86, 591],
    [87, 591], [88, 592], [89, 593], [90, 595], [91, 595], [92, 596], [93, 596],
    [94, 597], [95, 597], [96, 597], [97, 598], [98, 598], [99, 599], [100, 599],
    [101, 600], [102, 600], [103, 601], [104, 601], [105, 601], [106, 602], [107, 602],
    [108, 602], [109, 603], [110, 603], [111, 603], [112, 604], [113, 604], [114, 604]
  ]);

  constructor(
    private supabaseService: SupabaseService, 
    private ngZone: NgZone, 
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadSurahs();
    this.loadMemorizedSurahs();
  }

  async ionViewWillEnter() {
    // Initialize theme service when entering tab (use fallback location)
    await this.themeService.initialize(36.8065, 10.1815);
  }

  ngOnDestroy() {
    this.cleanupVirtualScroll();
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
  }

  async loadSurahs() {
    try {
      const response = await fetch('https://quranapi.pages.dev/api/surah.json');
      this.surahs = await response.json();
      this.surahs = this.surahs.map((s, i) => ({ ...s, surahNo: i + 1 }));
      this.filteredSurahs = this.surahs;
      this.loading = false;
    } catch (error) {
      console.error('Error loading surahs:', error);
      this.loading = false;
    }
  }

  async loadMemorizedSurahs() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('memorized_surahs')
        .select('surah_no');
      
      if (error) {
        console.log('Memorized surahs table not ready yet:', error.message);
        return;
      }
      
      if (data) {
        this.memorizedSurahs = new Set(data.map((d: any) => d.surah_no));
      }
    } catch (error) {
      console.error('Error loading memorized surahs:', error);
    }
  }

  async toggleMemorization(surahNo: number) {
    try {
      const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        return;
      }

      if (this.memorizedSurahs.has(surahNo)) {
        const { error } = await this.supabaseService.supabase
          .from('memorized_surahs')
          .delete()
          .eq('user_id', user.id)
          .eq('surah_no', surahNo);
        
        if (error) {
          console.log('Table not ready:', error.message);
          alert('Please run the SQL setup first. Check SUPABASE_SETUP.md file.');
          return;
        }
        this.memorizedSurahs.delete(surahNo);
      } else {
        const { error } = await this.supabaseService.supabase
          .from('memorized_surahs')
          .insert({ 
            user_id: user.id,
            surah_no: surahNo 
          });
        
        if (error) {
          console.log('Table not ready:', error.message);
          alert('Please run the SQL setup first. Check SUPABASE_SETUP.md file.');
          return;
        }
        this.memorizedSurahs.add(surahNo);
      }
    } catch (error) {
      console.error('Error toggling memorization:', error);
    }
  }

  getMemorizationPercentage(): number {
    let totalMemorizedAyahs = 0;
    
    this.memorizedSurahs.forEach(surahNo => {
      const surah = this.surahs.find(s => s.surahNo === surahNo);
      if (surah) {
        totalMemorizedAyahs += surah.totalAyah;
      }
    });
    
    const percentage = (totalMemorizedAyahs / this.totalAyahsInQuran) * 100;
    return parseFloat(percentage.toFixed(2));
  }

  getTotalMemorizedAyahs(): number {
    let total = 0;
    this.memorizedSurahs.forEach(surahNo => {
      const surah = this.surahs.find(s => s.surahNo === surahNo);
      if (surah) {
        total += surah.totalAyah;
      }
    });
    return total;
  }

  searchSurahs() {
    if (!this.searchQuery.trim()) {
      this.filteredSurahs = this.surahs;
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredSurahs = this.surahs.filter(s => 
      s.surahName.toLowerCase().includes(query) ||
      s.surahNameArabic.includes(query) ||
      s.surahNameTranslation.toLowerCase().includes(query)
    );
  }

  async openSurah(surahNo: number) {
    this.currentView = 'detail';
    this.jumpToAyahNumber = null;
    
    // Stop audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.isPlayingSurah = false;
    this.currentPlayingAyah = null;
    
    const meta = this.surahs.find(s => s.surahNo === surahNo);
    if (!meta) return;

    // Create stub immediately for instant UI feedback
    this.selectedSurah = {
      ...meta,
      english: [],
      arabic1: [],
      audio: null
    } as SurahDetail;
    this.cdr.detectChanges();

    try {
      // For very large surahs (>150 ayahs), default to page mode
      if (meta.totalAyah > 150) {
        this.currentPage = this.PAGE_MAP.get(surahNo) || 1;
        this.viewMode = 'page';
        await this.loadPageData(this.currentPage);
      } else {
        // Load full surah data
        await this.loadFullSurahDetails(surahNo);
        this.viewMode = 'ayah';
        
        // Start progressive rendering
        this.startProgressiveRender();
      }
    } catch (error) {
      console.error('Error loading surah:', error);
    }
  }

  async toggleViewMode(mode: 'ayah' | 'page') {
    this.cleanupVirtualScroll();
    this.viewMode = mode;
    
    if (mode === 'page' && this.selectedSurah) {
      const startPage = this.PAGE_MAP.get(this.selectedSurah.surahNo!) || 1;
      await this.loadPageData(startPage);
    } else {
      this.pageData = null;
      
      // Ensure surah data is loaded
      if (this.selectedSurah && (!this.selectedSurah.arabic1 || this.selectedSurah.arabic1.length === 0)) {
        await this.loadFullSurahDetails(this.selectedSurah!.surahNo!);
      }
      
      // Start progressive rendering
      this.startProgressiveRender();
    }
  }

  private async loadFullSurahDetails(surahNo: number) {
    // Check cache first
    if (this.surahCache.has(surahNo)) {
      this.selectedSurah = this.surahCache.get(surahNo)!;
      this.cdr.detectChanges();
      return;
    }

    // Load outside Angular zone to prevent blocking
    let detail: any;
    await this.ngZone.runOutsideAngular(async () => {
      const response = await fetch(`https://quranapi.pages.dev/api/${surahNo}.json`);
      detail = await response.json();
    });
    
    // Update in Angular zone
    this.ngZone.run(() => {
      this.selectedSurah = detail;
      this.surahCache.set(surahNo, detail);
      this.cdr.detectChanges();
    });
  }

  // PROGRESSIVE RENDERING - Render ayahs in batches to avoid UI freeze
  private startProgressiveRender() {
    if (!this.selectedSurah?.arabic1) return;
    
    // Clear any existing render timer
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }

    const totalAyahs = this.selectedSurah.arabic1.length;
    
    // Adaptive batch size based on surah length
    if (totalAyahs > 200) {
      this.renderBatchSize = 15; // Smaller batches for very large surahs
    } else if (totalAyahs > 100) {
      this.renderBatchSize = 25;
    } else if (totalAyahs > 50) {
      this.renderBatchSize = 40;
    } else {
      this.renderBatchSize = totalAyahs; // Render all at once for small surahs
    }

    // Start with first batch
    this.visibleAyahCount = Math.min(this.renderBatchSize, totalAyahs);
    this.ayahRendering = totalAyahs > this.renderBatchSize;
    this.cdr.detectChanges();

    // Continue rendering in batches
    if (this.ayahRendering) {
      this.ngZone.runOutsideAngular(() => {
        this.scheduleNextBatch(totalAyahs);
      });
    }
  }

  private scheduleNextBatch(totalAyahs: number) {
    if (this.visibleAyahCount >= totalAyahs || this.viewMode !== 'ayah') {
      this.ayahRendering = false;
      this.ngZone.run(() => this.cdr.detectChanges());
      return;
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleWork = (window as any).requestIdleCallback || 
      ((cb: Function) => setTimeout(cb, 1));

    scheduleWork(() => {
      this.ngZone.run(() => {
        this.visibleAyahCount = Math.min(
          this.visibleAyahCount + this.renderBatchSize,
          totalAyahs
        );
        this.cdr.detectChanges();
      });

      if (this.visibleAyahCount < totalAyahs) {
        this.scheduleNextBatch(totalAyahs);
      } else {
        this.ayahRendering = false;
        this.ngZone.run(() => this.cdr.detectChanges());
      }
    });
  }

  private cleanupVirtualScroll() {
    if (this.virtualScrollObserver) {
      this.virtualScrollObserver.disconnect();
      this.virtualScrollObserver = null;
    }
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
    this.visibleAyahCount = 0;
    this.ayahRendering = false;
  }

  async loadPageData(pageNumber: number) {
    // Check cache first
    if (this.pageCache.has(pageNumber)) {
      this.pageData = this.pageCache.get(pageNumber);
      this.currentPage = pageNumber;
      this.calculateBasmalaForPage();
      return;
    }

    this.pageLoading = true;
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/ar`);
      const json = await response.json();
      if (json.code === 200) {
        this.pageData = json.data;
        this.currentPage = pageNumber;
        this.pageCache.set(pageNumber, json.data);
        this.calculateBasmalaForPage();
      }
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      this.pageLoading = false;
    }
  }

  private calculateBasmalaForPage() {
    this.basmalaCharCount = null;
    const firstAyah = this.pageData?.ayahs?.[0];
    if (firstAyah && firstAyah.numberInSurah === 1) {
      const surahNoFromApi: number | undefined = firstAyah?.surah?.number;
      const surahNo = surahNoFromApi ?? this.inferSurahFromGlobalAyahNumber(firstAyah?.number) ?? undefined;
      if (surahNo && surahNo !== 1) {
        const variant = this.getBasmalaVariantAtStart(firstAyah.text);
        if (variant) {
          this.basmalaCharCount = variant.length;
        }
      }
    }
  }

  async nextPage() {
    if (this.currentPage < 604) {
      await this.loadPageData(this.currentPage + 1);
    }
  }

  async previousPage() {
    if (this.currentPage > 1) {
      await this.loadPageData(this.currentPage - 1);
    }
  }

  shouldShowBismillahOnPage(): boolean {
    const ayahs = this.pageData?.ayahs;
    if (!ayahs || ayahs.length === 0) return false;
    const first = ayahs[0];
    const numberInSurah: number | undefined = first?.numberInSurah;
    if (numberInSurah !== 1) return false;

    const surahNoFromApi: number | undefined = first?.surah?.number;
    const surahNo = surahNoFromApi ?? this.inferSurahFromGlobalAyahNumber(first?.number) ?? undefined;
    if (!surahNo) return false;

    return surahNo !== 1 && surahNo !== 9;
  }

  private inferSurahFromGlobalAyahNumber(globalAyahNumber?: number): number | null {
    if (!globalAyahNumber || !Array.isArray(this.surahs) || this.surahs.length === 0) return null;
    let cumulative = 0;
    for (const s of this.surahs) {
      cumulative += s.totalAyah;
      if (globalAyahNumber <= cumulative) {
        return (s.surahNo ?? null);
      }
    }
    return null;
  }

  private getBasmalaVariantAtStart(text: string | undefined | null): string | null {
    if (!text) return null;
    const t = text.trim();
    for (const v of this.BASMALA_VARIANTS) {
      if (t.startsWith(v)) return v;
    }
    return null;
  }

  isBasmalaAtStart(text: string, ayah: any): boolean {
    if (!text || !ayah) return false;
    if (ayah.numberInSurah !== 1) return false;
    const surahNo = ayah?.surah?.number ?? this.inferSurahFromGlobalAyahNumber(ayah?.number);
    // Only show for first ayah of surahs except Fatiha (1) and Tawbah (9)
    return surahNo !== 1 && surahNo !== 9;
  }

  getBasmalaText(text: string): string {
    const basmalaLength = 38; // Length of 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
    return text.substring(0, basmalaLength).trim();
  }

  getAfterBasmalaText(text: string): string {
    const basmalaLength = 38; // Length of 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
    return text.substring(basmalaLength).trimStart();
  }

  isLastAyahInSurah(ayah: any): boolean {
    if (!ayah || !ayah.surah) return false;
    const total = ayah.surah.numberOfAyahs as number | undefined;
    return !!total && ayah.numberInSurah === total;
  }

  nextAyahStartsWithBasmala(index: number): boolean {
    const next = this.pageData?.ayahs?.[index + 1];
    if (!next) return false;
    return this.isBasmalaAtStart(next.text, next);
  }

  getSurahNameForPageStart(ayah: any): string {
    if (!ayah || ayah.numberInSurah !== 1) return '';
    const surahNo = ayah?.surah?.number ?? this.inferSurahFromGlobalAyahNumber(ayah?.number);
    if (!surahNo || surahNo === 1) return ''; // Don't show for Al-Fatiha
    
    return ayah?.surah?.name || '';
  }

  shouldShowSurahName(ayah: any, index: number): boolean {
    if (!ayah || ayah.numberInSurah !== 1) return false;
    const surahNo = ayah?.surah?.number ?? this.inferSurahFromGlobalAyahNumber(ayah?.number);
    return !!surahNo && surahNo !== 1; // Show for all surahs except Al-Fatiha
  }

  trackByAyahIndex(index: number, _item: any) { return index; }
  trackByPageAyahIndex(index: number, _item: any) { return index; }

  increasePageFont() {
    if (this.pageFontSizePx < 40) this.pageFontSizePx += 2;
  }

  decreasePageFont() {
    if (this.pageFontSizePx > 18) this.pageFontSizePx -= 2;
  }

  jumpToAyah() {
    if (this.jumpToAyahNumber && this.selectedSurah) {
      const ayahIndex = this.jumpToAyahNumber - 1;
      if (ayahIndex >= 0 && ayahIndex < this.selectedSurah.arabic1.length) {
        // Ensure ayah is rendered
        if (ayahIndex >= this.visibleAyahCount) {
          this.visibleAyahCount = ayahIndex + 20; // Render up to this ayah + buffer
          this.cdr.detectChanges();
        }
        
        setTimeout(() => {
          const el = document.getElementById(`ayah-${ayahIndex}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }

  async jumpToPage() {
    if (this.jumpToPageNumber && this.jumpToPageNumber >= 1 && this.jumpToPageNumber <= 604) {
      await this.loadPageData(this.jumpToPageNumber);
    }
  }

  toggleReciterList() {
    this.showReciterList = !this.showReciterList;
  }

  selectReciter(reciterId: string) {
    this.selectedReciter = reciterId;
    this.showReciterList = false;
    
    if (this.isPlayingSurah) {
      this.playSurahAudio();
    }
  }

  playSurahAudio() {
    if (!this.selectedSurah || !this.selectedSurah.audio) return;

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    if (this.isPlayingSurah) {
      this.isPlayingSurah = false;
      this.currentPlayingAyah = null;
      return;
    }

    const audioData = this.selectedSurah.audio[this.selectedReciter];
    if (audioData && audioData.url) {
      this.isPlayingSurah = true;
      this.audioElement = new Audio(audioData.url);
      
      this.audioElement.play().catch(err => {
        console.error('Error playing surah audio:', err);
        this.isPlayingSurah = false;
      });

      this.audioElement.onended = () => {
        this.isPlayingSurah = false;
        this.audioElement = null;
      };

      this.audioElement.onerror = () => {
        console.error('Error loading surah audio');
        this.isPlayingSurah = false;
        this.audioElement = null;
      };
    }
  }

  getSelectedReciterName(): string {
    const reciter = this.reciters.find(r => r.id === this.selectedReciter);
    return reciter ? reciter.nameArabic : '';
  }

  playAudio(ayahIndex: number) {
    if (this.audioElement) {
      this.audioElement.pause();
    }

    if (this.currentPlayingAyah === ayahIndex) {
      this.currentPlayingAyah = null;
      return;
    }

    const audioUrl = this.selectedSurah?.audio[this.selectedReciter]?.url;
    if (audioUrl) {
      this.audioElement = new Audio(audioUrl);
      this.audioElement.play();
      this.currentPlayingAyah = ayahIndex;
      
      this.audioElement.onended = () => {
        this.currentPlayingAyah = null;
      };
    }
  }

  backToList() {
    this.cleanupVirtualScroll();
    this.currentView = 'list';
    this.selectedSurah = null;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
      this.currentPlayingAyah = null;
    }
    this.isPlayingSurah = false;
  }

  async handleRefresh(event: any) {
    try {
      if (this.currentView === 'list') {
        await this.loadMemorizedSurahs();
      } else if (this.currentView === 'detail' && this.selectedSurah) {
        const surahNo = this.selectedSurah.surahNo!;
        this.surahCache.delete(surahNo);
        if (this.viewMode === 'page') {
          this.pageCache.delete(this.currentPage);
          await this.loadPageData(this.currentPage);
        } else {
          await this.loadFullSurahDetails(surahNo);
          this.startProgressiveRender();
        }
      }
      console.log('✅ Tab4 refreshed');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      event.target.complete();
    }
  }
}