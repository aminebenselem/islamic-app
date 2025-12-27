import { Injectable } from '@angular/core';
import { SupabaseClient, createClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public  supabase: SupabaseClient;
  public session$ = new BehaviorSubject<Session | null>(null);
  public user$ = new BehaviorSubject<User | null>(null);

  constructor() {
   const SUPABASE_URL = 'https://annjtbfjooqjvbefbljx.supabase.co';
   const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubmp0YmZqb29xanZiZWZibGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODU2NDcsImV4cCI6MjA3NzM2MTY0N30.hXvX_MuIS3foNc2r-hXh8nPO3yvwnyc85jmNE_GeZIc';
   this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
     realtime: {
       params: {
         eventsPerSecond: 10
       }
     }
   });

    // Initialize session on app start
    this.initSession();
  }

  private async initSession() {
  const { data } = await this.supabase.auth.getSession(); // <-- note the .auth here
  this.session$.next(data.session);
  this.user$.next(data.session?.user || null);

  this.supabase.auth.onAuthStateChange((_event, session) => {
    this.session$.next(session);
    this.user$.next(session?.user || null);
  });
}

 /** Returns current session */
get currentSession(): Session | null {
  return this.session$.value;
}

/** Returns current user */
get currentUser(): User | null {
  return this.user$.value;
}

  /** Email + Password Sign Up */
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  /** Email + Password Sign In */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  /** Google OAuth Sign In */
 async signInWithGoogle() {
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'myapp://login',
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  // MUST open with system browser
  if (data?.url) {
    // IMPORTANT: open in system browser, NOT in-app WebView
    (window as any).open(data.url, '_system');
  }

  return data;
}

  /** Sign out */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;

    // Clear local state
    this.session$.next(null);
    this.user$.next(null);
  }

  /** Route Guard Helper: is user logged in? */
  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  /** Route Guard Helper: is email confirmed? */
  isEmailConfirmed(): boolean {
    return this.currentUser?.confirmed_at != null;
  }
  
async loadMoonPhase(country: string) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, error } = await this.supabase
    .from('moon_phase')
    .select('*')
    .eq('country_name', country)
    .eq('date', today)
    .maybeSingle();

  if (error) throw error;
  return data; // returns null if no record
}
async saveMoonPhaseToDB(data: any) {
  const cleanTime = (value: string | null | undefined) => {
    if (!value || value === '-:-' || value === '') return null;
    return value;
  };

  const record = {
    date: data.date,
    country_name: data.location.country_name,
    city: data.location.city,
    moon_phase: data.moon_phase,
    moon_illumination_percentage: data.moon_illumination_percentage,
    sunrise: cleanTime(data.sunrise),
    sunset: cleanTime(data.sunset),
    moonrise: cleanTime(data.moonrise),
    moonset: cleanTime(data.moonset),
  };

  // Use upsert to prevent duplicates - update if exists, insert if not
  const { error } = await this.supabase
    .from('moon_phase')
    .upsert(record, {
      onConflict: 'date,country_name',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('❌ Supabase upsert error:', error.message, data);
    throw error;
  }

  console.log('✅ Moon phase saved successfully');
}


}
