import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PrayerTimeService } from '../services/prayer-times.service';
import { Geolocation } from '@capacitor/geolocation';
import { getCountryAndCity } from '../../helpers/location';
import { SupabaseService } from '../services/supabase';
import { register } from 'swiper/element/bundle';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';

export interface PrayerTask {
  id: string;
  user_id: string;
  date: string;
  prayer_time: string;
  title: string;
  completed?: boolean;
  created_at?: string;
}

register();

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  @ViewChild('swiper') swiperRef?: ElementRef;

  latitude = 0;
  longitude = 0;
  country?: string;
  city?: string;
  prayers: any[] = [];
  times: any;
  activePrayer: any = null;
  tasks: PrayerTask[] = [];
  progressPercentage = 0; // Tasks progress
  // Quran memorization progress (same logic as Tab4)
  quranProgressPercentage = 0;
  quranTotalMemorizedAyahs = 0;
  private qMemorizedSurahs: Set<number> = new Set();
  private qSurahs: Array<{ surahNo: number; totalAyah: number }> = [];
  private readonly totalAyahsInQuran = 6236;
  loading = false;

  constructor(
    private prayerService: PrayerTimeService,
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController,
    private route: Router,
    private themeService: ThemeService
  ) {}

  async ngOnInit() {
    await this.initialize();
  }

  async ionViewWillEnter() {
    console.log('🔁 Tab1 re-entered — refreshing tasks');
    // Initialize theme service when entering tab
    if (this.latitude && this.longitude) {
      await this.themeService.initialize(this.latitude, this.longitude);
    }
    await this.loadTasks();
  }
  /** MAIN INITIALIZER */
  private async initialize() {
    try {
      await this.getCurrentLocation();
      await this.themeService.initialize(this.latitude, this.longitude);
      await this.loadPrayerTimes();
      await this.loadTasks();
      await this.loadQuranProgress();
    } catch (error) {
      console.error('❌ Initialization failed:', error);
    } finally {
      this.loading = false;
    }
  }

  /** GEOLOCATION WITH FALLBACK */
  private async getCurrentLocation() {
    const fallback = { lat: 36.8065, lon: 10.1815 }; // Tunis fallback
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
      const loc = await getCountryAndCity(this.latitude, this.longitude);
      this.country = loc.country;
      this.city = loc.city;
      console.log('📍 Location:', this.city, this.country);
    } catch (error) {
      console.warn('⚠️ Using fallback location:', error);
      this.latitude = fallback.lat;
      this.longitude = fallback.lon;
      this.city = 'Tunis';
      this.country = 'Tunisia';
    }
  }

  /** FETCH PRAYER TIMES */
  private async loadPrayerTimes() {
    return new Promise<void>((resolve, reject) => {
      this.prayerService.getPrayerTimesByCoords(this.latitude, this.longitude).subscribe({
        next: (result) => {
          this.times = result;
          this.buildPrayersList(result);
          console.log('🕌 Prayer times loaded:', this.prayers);
          resolve();
        },
        error: (err) => {
          console.error('❌ Error fetching prayer times:', err);
          reject(err);
        },
      });
    });
  }

  /** LOAD QURAN PROGRESS (matches Tab4 logic) */
  private async loadQuranProgress() {
    try {
      // Load surah metadata (totalAyah per surah)
      const res = await fetch('https://quranapi.pages.dev/api/surah.json');
      const surahsJson = await res.json();
      this.qSurahs = surahsJson.map((s: any, i: number) => ({ surahNo: i + 1, totalAyah: s.totalAyah }));

      // Ensure user exists then load memorized surahs (RLS will filter by user)
      const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
      if (!user) {
        this.qMemorizedSurahs = new Set();
        this.computeQuranProgress();
        return;
      }

      const { data, error } = await this.supabaseService.supabase
        .from('memorized_surahs')
        .select('surah_no');

      if (error) {
        console.warn('⚠️ Could not load memorized_surahs:', error.message);
        this.qMemorizedSurahs = new Set();
      } else if (data) {
        this.qMemorizedSurahs = new Set(data.map((d: any) => d.surah_no));
      }

      this.computeQuranProgress();
    } catch (e) {
      console.error('❌ Error loading Quran progress:', e);
      this.qMemorizedSurahs = new Set();
      this.quranProgressPercentage = 0;
      this.quranTotalMemorizedAyahs = 0;
    }
  }

  private computeQuranProgress() {
    let totalMemAyahs = 0;
    this.qMemorizedSurahs.forEach((no) => {
      const s = this.qSurahs.find((x) => x.surahNo === no);
      if (s) totalMemAyahs += s.totalAyah;
    });
    this.quranTotalMemorizedAyahs = totalMemAyahs;
    const pct = (totalMemAyahs / this.totalAyahsInQuran) * 100;
    // Show two decimals, as in Tab4
    this.quranProgressPercentage = parseFloat(pct.toFixed(2));
  }

  /** BUILD PRAYERS LIST */
  private buildPrayersList(times: any) {
    const validNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha' ,'tomorrowFajr'];
    this.prayers = Object.entries(times)
      .filter(([name]) => validNames.includes(name))
      .map(([name, time], index) => ({
        id: index + 1,
        name,
        time,
      }));
    this.activePrayer = this.prayers[0];
  }

  /** LOAD TASKS FOR USER */
private async loadTasks() {
  const user = (await this.supabaseService.supabase.auth.getUser()).data.user;
  if (!user) return;

  // Get all tasks for the user (we’ll filter in code)
  const { data, error } = await this.supabaseService.supabase
    .from('prayer_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
    .order('prayer_time', { ascending: true });

  if (error) throw error;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

  const upcoming = data.filter((t) => {
    if (!t.date) return false;

    const taskDateStr = t.date; // Already in "YYYY-MM-DD" format from DB

    // If task is in the future → keep it
    if (taskDateStr > todayStr) return true;

    // If task is today → check if it's still upcoming
    if (taskDateStr === todayStr && t.prayer_time) {
      try {
        // Convert prayer_time like "Asr", "Maghrib" to real time if possible
        const prayer = this.prayers.find((p) => p.name === t.prayer_time);
        if (prayer && prayer.time) {
          const [hours, minutes] = prayer.time.split(':').map(Number);
          const taskTime = new Date();
          taskTime.setHours(hours, minutes, 0, 0);
          return taskTime > now;
        }
      } catch {
        return true; // fallback — keep it if we can't parse
      }
    }

    return false; // past task
  });

  // Map and set
  this.tasks = upcoming.map((t) => ({
    ...t,
    completed: t.completed ?? false,
  }));

  this.updateProgress();
}


  /** UPDATE COMPLETION STATUS LOCALLY + DB */
  async toggleTaskCompletion(task: PrayerTask) {
    const newStatus = task.completed;

    try {
      const { error } = await this.supabaseService.supabase
        .from('prayer_tasks')
        .update({ completed: newStatus })
        .eq('id', task.id);

      if (error) throw error;

      this.updateProgress();
      this.showToast(
        newStatus
          ? `✅ Marked "${task.title}" as done`
          : `↩️ Marked "${task.title}" as not done`
      );
    } catch (err) {
      console.error('❌ Error updating task status:', err);
      this.showToast('⚠️ Failed to update task. Please try again.');
      // Revert if failed
      task.completed = !newStatus;
    }
  }

  /** COMPUTE PROGRESS */
  updateProgress() {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.completed).length;
    this.progressPercentage = total ? Math.round((done / total) * 100) : 0;
  }

  /** OPTIONAL TOAST */
  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'bottom',
      color: 'success',
    });
    toast.present();
  }

  /** VIEW ALL TASKS */
  viewAllTasks() {
    this.route.navigate(['/tabs/tab1/all-tasks']);
  }

  /** PULL TO REFRESH */
  async handleRefresh(event: any) {
    try {
      await this.getCurrentLocation();
      await this.loadPrayerTimes();
      await this.loadTasks();
      await this.loadQuranProgress();
      console.log('✅ Tab1 refreshed');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      event.target.complete();
    }
  }
}