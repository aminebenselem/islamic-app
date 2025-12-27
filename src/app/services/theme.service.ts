import { Injectable } from '@angular/core';
import { PrayerTimeService } from './prayer-times.service';
import { Preferences } from '@capacitor/preferences';

export type ThemeMode = 'sunrise' | 'fajr' | 'dhuhr' | 'asr' | 'sunset' | 'maghrib' | 'isha' | 'midnight' | 'system';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  tomorrowFajr?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: ThemeMode = 'system';
  private prayerTimes: PrayerTimes | null = null;
  private checkInterval: any;

  constructor(private prayerService: PrayerTimeService) {}

  async initialize(lat: number, lon: number) {
    // Load saved theme preference
    const { value } = await Preferences.get({ key: 'theme' });
    this.currentTheme = (value as ThemeMode) || 'system';

    // Load prayer times
    await this.loadPrayerTimes(lat, lon);

    // Apply theme
    this.applyTheme();

    // Check every minute if system theme
    if (this.currentTheme === 'system') {
      this.startAutoThemeCheck();
    }
  }

  private async loadPrayerTimes(lat: number, lon: number): Promise<void> {
    return new Promise((resolve) => {
      this.prayerService.getPrayerTimesByCoords(lat, lon).subscribe({
        next: (times) => {
          this.prayerTimes = times;
          console.log('🕌 Prayer times loaded for theme service:', times);
          resolve();
        },
        error: (err) => {
          console.error('❌ Error loading prayer times for theme:', err);
          resolve();
        }
      });
    });
  }

  async setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
    await Preferences.set({ key: 'theme', value: theme });

    // Stop auto-check if not system
    if (theme !== 'system') {
      this.stopAutoThemeCheck();
      this.applyStaticTheme(theme);
    } else {
      this.applyTheme();
      this.startAutoThemeCheck();
    }
  }

  async getTheme(): Promise<ThemeMode> {
    const { value } = await Preferences.get({ key: 'theme' });
    return (value as ThemeMode) || 'system';
  }

  private applyTheme() {
    if (this.currentTheme === 'system') {
      const calculatedTheme = this.calculateThemeBasedOnTime();
      this.applyStaticTheme(calculatedTheme);
    } else {
      this.applyStaticTheme(this.currentTheme);
    }
  }

  private applyStaticTheme(theme: ThemeMode) {
    if (theme === 'system') return;
    document.body.setAttribute('data-theme', theme);
    console.log('🎨 Theme applied:', theme);
  }

  private calculateThemeBasedOnTime(): ThemeMode {
    if (!this.prayerTimes) return 'sunrise';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Parse prayer times to minutes
    const fajr = this.parseTimeToMinutes(this.prayerTimes.Fajr);
    const sunrise = this.parseTimeToMinutes(this.prayerTimes.Sunrise);
    const dhuhr = this.parseTimeToMinutes(this.prayerTimes.Dhuhr);
    const asr = this.parseTimeToMinutes(this.prayerTimes.Asr);
    const sunset = this.parseTimeToMinutes(this.prayerTimes.Sunset);
    const maghrib = this.parseTimeToMinutes(this.prayerTimes.Maghrib);
    const isha = this.parseTimeToMinutes(this.prayerTimes.Isha);

    // Calculate theme switch times based on your requirements
    const sunriseEnd = dhuhr - 120; // 2 hours before Dhuhr
    const sunsetStart = sunset - 30; // 30 min before sunset
    const asrEnd = sunset - 30; // Asr ends 30 min before sunset
    const maghribEnd = isha - 20; // Maghrib ends 20 min before Isha
    const ishaStart = isha - 20; // Isha theme starts 20 min before Isha
    const midnightStart = isha + 20; // Midnight starts 20 min after Isha

    // Theme logic
    if (currentMinutes >= fajr && currentMinutes < sunrise) {
      return 'fajr'; // Fajr time until sunrise
    } else if (currentMinutes >= sunrise && currentMinutes < sunriseEnd) {
      return 'sunrise'; // Sunrise until 2 hours before Dhuhr
    } else if (currentMinutes >= sunriseEnd && currentMinutes < dhuhr) {
      return 'dhuhr'; // 2 hours before Dhuhr until Dhuhr
    } else if (currentMinutes >= dhuhr && currentMinutes < asr) {
      return 'dhuhr'; // Dhuhr time until Asr
    } else if (currentMinutes >= asr && currentMinutes < asrEnd) {
      return 'asr'; // Asr time until 30 min before sunset
    } else if (currentMinutes >= sunsetStart && currentMinutes < maghrib) {
      return 'sunset'; // 30 min before sunset until Maghrib
    } else if (currentMinutes >= maghrib && currentMinutes < maghribEnd) {
      return 'maghrib'; // Maghrib until 20 min before Isha
    } else if (currentMinutes >= ishaStart && currentMinutes < midnightStart) {
      return 'isha'; // 20 min before Isha until 20 min after Isha
    } else if (currentMinutes >= midnightStart || currentMinutes < fajr) {
      return 'midnight'; // 20 min after Isha until Fajr
    }

    return 'sunrise'; // Fallback
  }

  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private startAutoThemeCheck() {
    this.stopAutoThemeCheck();
    // Check every minute
    this.checkInterval = setInterval(() => {
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    }, 60000); // 60 seconds
  }

  private stopAutoThemeCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async refreshPrayerTimes(lat: number, lon: number) {
    await this.loadPrayerTimes(lat, lon);
    if (this.currentTheme === 'system') {
      this.applyTheme();
    }
  }

  destroy() {
    this.stopAutoThemeCheck();
  }
}
