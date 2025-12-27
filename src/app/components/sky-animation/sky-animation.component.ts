import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { getMoonImage } from 'src/helpers/moon';
import { getCountryAndCity } from 'src/helpers/location';
import { SupabaseService } from 'src/app/services/supabase';
import { Router } from '@angular/router';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-sky-animation',
  templateUrl: './sky-animation.component.html',
  styleUrls: ['./sky-animation.component.scss'],
  standalone: false
})
export class SkyAnimationComponent implements OnInit, OnDestroy {

  moonBackground: string = "url('../../../assets/1.0.svg') center/cover no-repeat";
  moonOpacity = 0;

  // TODO: move to environment configuration if needed
  protected apiKey = '8af80a6de6514dc9ace63d1a1e1dfd56';
  myWidth = 0;
  myHeight = 0;
  currentTimeOfDay: string = 'def';
  sunPosition = { x: 200, y: 100 };

  latitude = 0;
  longitude = 0;
  country: string | undefined;
  city: string | undefined;

  private static moonFetchPromises: Map<string, Promise<any>> = new Map();

  // Cached DOM references to avoid repeated querySelector calls
  private elSun!: HTMLElement | null;
  private elSunDay!: HTMLElement | null;
  private elSunSet!: HTMLElement | null;
  private elDarkness!: HTMLElement | null;
  private elMoon!: HTMLElement | null;
  private elStars!: HTMLElement | null;
  private elSky!: HTMLElement | null;

  private resizeRafPending = false;
  private mutationObserver!: MutationObserver;

  constructor(
    private elementRef: ElementRef,
    private supaBaseService: SupabaseService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  async ngOnInit() {
    await this.initializeData();
    if (this.country) {
      await this.displayMoon(this.country);
    }

    // Cache element references once
    this.cacheDomElements();

    this.updateDimensions();
    window.addEventListener('resize', this.onWindowResize);

    // Generate stars only once; we will not fully regenerate on every resize
    this.generateStars(100);

    // Initial theme sync
    this.syncWithThemeService();
    this.observeThemeChanges();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  private async syncWithThemeService() {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme && currentTheme !== this.currentTimeOfDay) {
      this.currentTimeOfDay = currentTheme;
      this.updateSkyElements();
    }
  }

  private observeThemeChanges() {
    this.mutationObserver = new MutationObserver(() => this.syncWithThemeService());
    this.mutationObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ────────────────────────────────
  // 🔁 Lifecycle Helpers
  // ────────────────────────────────
  private onWindowResize = () => {
    if (this.resizeRafPending) return;
    this.resizeRafPending = true;
    requestAnimationFrame(() => {
      this.resizeRafPending = false;
      this.updateDimensions();
      // Instead of full regeneration, just reposition stars and update sky
      this.repositionStars();
      this.updateSkyElements();
    });
  };

  private async initializeData() {
    await this.getLocation();
    const { country, city } = await getCountryAndCity(this.latitude, this.longitude);
    this.country = country;
    this.city = city;
  }

  // ────────────────────────────────
  // 📍 Location
  // ────────────────────────────────
  private async getLocation() {
    try {
      await Geolocation.requestPermissions();
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
    } catch {
      // Fallback (Tunis)
      this.latitude = 36.8065;
      this.longitude = 10.1815;
    }
  }

  // ────────────────────────────────
  // 🕌 Prayer Times
  // ────────────────────────────────
 

  // ────────────────────────────────
  // 🌄 Sky Animation
  // ────────────────────────────────
  setTimeOfDay(timeOfDay: string) {
    if (timeOfDay === this.currentTimeOfDay) return;
    this.currentTimeOfDay = timeOfDay;
    this.updateSkyElements();
  }

  private updateSkyElements() {
    const settings = this.getSkySettings();
    this.sunPosition = settings.sunPosition;

    if (this.elSun) {
      this.elSun.style.background = `radial-gradient(circle at ${this.sunPosition.x}px ${this.sunPosition.y}px,
        rgba(242,248,247,1) 0%, rgba(249,249,28,1) 3%, rgba(247,214,46,1) 8%,
        rgba(248,200,95,1) 12%, rgba(201,165,132,1) 30%, rgba(46,97,122,1) 85%, rgba(24,75,106,1) 100%)`;
      this.elSun.style.opacity = String(settings.sunOpacity);
    }
    if (this.elSunDay) this.elSunDay.style.opacity = String(settings.sunDayOpacity);
    if (this.elSunSet) this.elSunSet.style.opacity = String(settings.sunSetOpacity);
    if (this.elSky) {
      this.elSky.style.backgroundColor = settings.skyColor;
      this.elSky.style.opacity = String(settings.skyOpacity);
    }
    if (this.elMoon) {
      this.elMoon.style.opacity = String(settings.moonOpacity);
      if (settings.moonOpacity > 0.1) {
        this.elMoon.style.left = '50%';
        this.elMoon.style.top = '8%';
      }
    }
    if (this.elStars) this.elStars.style.opacity = String(settings.starsOpacity);
    if (this.elDarkness) this.elDarkness.style.opacity = String(settings.darknessOpacity);
  }

  private getSkySettings() {
    const w = this.myWidth;
    const h = this.myHeight;

    switch (this.currentTimeOfDay) {
      case 'fajr':
        return { sunPosition: { x: w * 0.2, y: h * 0.9 }, sunOpacity: 0.1, sunDayOpacity: 0.1, sunSetOpacity: 0,
          skyOpacity: 0.2, moonOpacity: 0.6, starsOpacity: 0.6, darknessOpacity: 0.7, skyColor: '#243b55' };
      case 'sunrise':
        return { sunPosition: { x: w * 0.85, y: h * 0.95 }, sunOpacity: 1, sunDayOpacity: 0, sunSetOpacity: 0,
          skyOpacity: 0.5, moonOpacity: 0, starsOpacity: 0, darknessOpacity: 0.1, skyColor: '#FFD27F' };
      case 'dhuhr':
        return { sunPosition: { x: w * 0.5, y: h * 0.2 }, sunOpacity: 0.5, sunDayOpacity: 0.4, sunSetOpacity: 0,
          skyOpacity: 0.9, moonOpacity: 0, starsOpacity: 0, darknessOpacity: 0, skyColor: '#87CEEB' };
      case 'asr':
        return { sunPosition: { x: w * 0.3, y: h * 0.4 }, sunOpacity: 0.5, sunDayOpacity: 0.1, sunSetOpacity: 0,
          skyOpacity: 0.8, moonOpacity: 0, starsOpacity: 0, darknessOpacity: 0.1, skyColor: '#7FBBFF' };
      case 'sunset':
        return { sunPosition: { x: w * 0.15, y: h * 0.95 }, sunOpacity: 1, sunDayOpacity: 0.1, sunSetOpacity: 0,
          skyOpacity: 0.5, moonOpacity: 0, starsOpacity: 0.09, darknessOpacity: 0.5, skyColor: '#FFD27F' };
      case 'maghrib':
        return { sunPosition: { x: w * 0.9, y: h * 1 }, sunOpacity: 0.2, sunDayOpacity: 0.1, sunSetOpacity: 0,
          skyOpacity: 0.2, moonOpacity: 0, starsOpacity: 0.4, darknessOpacity: 0.5, skyColor: '#4169E1' };
      case 'isha':
        return { sunPosition: { x: w * 0.15, y: h * 0.95 }, sunOpacity: 0, sunDayOpacity: 0, sunSetOpacity: 0,
          skyOpacity: 0.1, moonOpacity: 0.6, starsOpacity: 0.5, darknessOpacity: 0.1, skyColor: '#191970' };
       case 'midnight':
        return { sunPosition: { x: w * 0.5, y: h * 1.2 }, sunOpacity: 0, sunDayOpacity: 0, sunSetOpacity: 0,
          skyOpacity: 0.1, moonOpacity: 1, starsOpacity: 1, darknessOpacity: 0.3, skyColor: '#191970' };
      default:
         return { sunPosition: { x: w * 0, y: h * 0 }, sunOpacity: 0, sunDayOpacity: 0, sunSetOpacity: 0,
          skyOpacity: 0.5, moonOpacity: 0, starsOpacity: 0, darknessOpacity: 0, skyColor: '#FFD27F' };
    }
  }

  // ────────────────────────────────
  // 🌟 Utility
  // ────────────────────────────────
  private updateDimensions() {
    this.myWidth = window.innerWidth;
    this.myHeight = window.innerHeight;
  }

  private generateStars(count: number) {
    if (!this.elStars) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.position = 'absolute';
      star.style.width = '2px';
      star.style.height = '2px';
      star.style.backgroundColor = 'white';
      star.style.borderRadius = '50%';
      star.style.top = Math.random() * this.myHeight + 'px';
      star.style.left = Math.random() * this.myWidth + 'px';
      fragment.appendChild(star);
    }
    this.elStars.innerHTML = '';
    this.elStars.appendChild(fragment);
  }

  private repositionStars() {
    if (!this.elStars) return;
    const stars = this.elStars.querySelectorAll('.star');
    stars.forEach(star => {
      (star as HTMLElement).style.top = Math.random() * this.myHeight + 'px';
      (star as HTMLElement).style.left = Math.random() * this.myWidth + 'px';
    });
  }
  private async fetchMoonPhaseFromAPI() {
    const res = await fetch(`https://api.ipgeolocation.io/astronomy?apiKey=${this.apiKey}`);
    return await res.json();
  }

  private async getOrFetchMoonPhase(country: string) {
    const cacheKey = `${country}-${new Date().toISOString().split('T')[0]}`;
    const existing = SkyAnimationComponent.moonFetchPromises.get(cacheKey);
    if (existing) return existing;

    const fromDb = await this.supaBaseService.loadMoonPhase(country);
    if (fromDb) return fromDb;

    const fetchPromise = (async () => {
      try {
        const data = await this.fetchMoonPhaseFromAPI();
        await this.supaBaseService.saveMoonPhaseToDB(data);
        return data;
      } finally {
        SkyAnimationComponent.moonFetchPromises.delete(cacheKey);
      }
    })();
    SkyAnimationComponent.moonFetchPromises.set(cacheKey, fetchPromise);
    return await fetchPromise;
  }

  private async displayMoon(country: string) {
    const moon = await this.getOrFetchMoonPhase(country);
    const illum = parseFloat(moon.moon_illumination_percentage) / 100;
    const moonImg = getMoonImage(illum);
    this.moonBackground = `url('${moonImg}') center/cover no-repeat`;
    this.moonOpacity = 1;
  }

  private cacheDomElements() {
    const root = this.elementRef.nativeElement;
    this.elSun = root.querySelector('#sun');
    this.elSunDay = root.querySelector('#sunDay');
    this.elSunSet = root.querySelector('#sunSet');
    this.elDarkness = root.querySelector('#darknessOverlay');
    this.elMoon = root.querySelector('#moon');
    this.elStars = root.querySelector('#starsContainer');
    this.elSky = root.querySelector('#sky');
  }
}
