import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../services/supabase';
import { ToastController } from '@ionic/angular';
import { ThemeService, ThemeMode } from '../services/theme.service';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit {

  userEmail = '';
  avatar_url = '';
  displayName = '';
  selectedLang = 'en';
  selectedTheme: ThemeMode = 'system';
  themes: ThemeMode[] = ['system', 'fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'maghrib', 'isha', 'midnight'];
  
  latitude = 0;
  longitude = 0;

  constructor(
    private supabase: SupabaseService,
    private toastCtrl: ToastController,
    private themeService: ThemeService
  ) {}

  async ngOnInit() {
    // Get location first
    await this.getCurrentLocation();
    
    // Initialize theme service with location
    await this.themeService.initialize(this.latitude, this.longitude);
    
    // Load saved theme preference
    this.selectedTheme = await this.themeService.getTheme();
    
    // Load user data
    const { data: { user } } = await this.supabase.supabase.auth.getUser();
    if (user) {
      this.userEmail = user.email || '';
      this.avatar_url = user.user_metadata?.['avatar_url'] || 'https://ionicframework.com/docs/img/demos/avatar.svg';
      this.displayName = user.user_metadata?.['name'] || '';
    } else {
      this.userEmail = '';
      this.avatar_url = 'https://ionicframework.com/docs/img/demos/avatar.svg';
      this.displayName = '';
    }
    console.log(user);
  }

  async ionViewWillEnter() {
    // Reload theme when entering the tab to sync with any changes
    this.selectedTheme = await this.themeService.getTheme();
  }

  private async getCurrentLocation() {
    const fallback = { lat: 36.8065, lon: 10.1815 }; // Tunis fallback
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
      console.log('📍 Location:', this.latitude, this.longitude);
    } catch (error) {
      console.warn('⚠️ Using fallback location:', error);
      this.latitude = fallback.lat;
      this.longitude = fallback.lon;
    }
  }

  async applyTheme(theme: ThemeMode) {
    this.selectedTheme = theme;
    await this.themeService.setTheme(theme);
    await this.presentToast(`Theme set to: ${theme === 'system' ? 'Auto (based on prayer times)' : theme}`);
  }

  private async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }

  switchLanguage(lang: string) {
    this.selectedLang = lang;
    // you'll hook your translation service here later
    console.log('Language switched to:', lang);
  }

  async saveSettings() {
    await this.applyTheme(this.selectedTheme);
    await this.presentToast('Settings saved!');
  }

  async logout() {
    await this.supabase.signOut();
    // navigate to login
  }

  /** PULL TO REFRESH */
  async handleRefresh(event: any) {
    try {
      await this.getCurrentLocation();
      await this.themeService.refreshPrayerTimes(this.latitude, this.longitude);
      this.selectedTheme = await this.themeService.getTheme();
      console.log('✅ Tab3 refreshed');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      event.target.complete();
    }
  }
}