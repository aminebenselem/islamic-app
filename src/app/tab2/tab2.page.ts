// prayer-calendar.page.ts
import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';
import { SkyAnimationComponent } from '../components/sky-animation/sky-animation.component';
import { ThemeService } from '../services/theme.service';

interface Task {
  id?: string;
  user_id?: string;
  date: string;
  prayer_time: string;
  title: string;
  duration?: number;
  created_at?: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {

// User state
  currentUser: any = null;
  isAuthenticated: boolean = false;
  
  // Calendar state
  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  calendarType: 'gregorian' | 'hijri' = 'gregorian';
  
  // Calendar data
  calendarDays: any[] = [];
  monthName: string = '';
  yearDisplay: string = '';
  
  // Tasks
  tasks: Task[] = [];
  selectedDateTasks: Task[] = [];
  
  // Prayer times
  prayerTimes = [
    { value: 'fajr', label: 'After Fajr', icon: '🌅' },
    { value: 'dhuhr', label: 'After Dhuhr', icon: '☀️' },
    { value: 'asr', label: 'After Asr', icon: '🌤️' },
    { value: 'maghrib', label: 'After Maghrib', icon: '🌆' },
    { value: 'isha', label: 'After Isha', icon: '🌙' }
  ];
  
  // Task form
  showTaskForm: boolean = false;
  newTask = {
    title: '',
    prayer_time: 'fajr',
    duration: null as number | null
  };

  constructor(
    private alertController: AlertController,
    private themeService: ThemeService,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    this.supabaseService.user$.subscribe(user => {
      this.currentUser = user;
    });
    await this.loadTasks();
    this.generateCalendar();
  }

  async ionViewWillEnter() {
    // Initialize theme service when entering tab (use fallback location)
    await this.themeService.initialize(36.8065, 10.1815);
  }

  // Authentication
  

 

  

 

  // Generate calendar grid
  generateCalendar() {
    if (this.calendarType === 'gregorian') {
      this.generateGregorianCalendar();
    } else {
      this.generateHijriCalendar();
    }
  }

  generateGregorianCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    this.monthName = monthNames[month];
    this.yearDisplay = year.toString();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    this.calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ day: null, date: null });
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const tasksCount = this.getTasksForDate(date).length;
      
      this.calendarDays.push({
        day,
        date,
        tasksCount,
        isToday: this.isToday(date),
        isSelected: this.selectedDate && this.isSameDay(date, this.selectedDate)
      });
    }
  }

   generateHijriCalendar() {
    // Get current Hijri date using accurate conversion
    const gregorianDate = this.currentDate;
    const hijriDate = this.toHijri(gregorianDate);
    
    const hijriMonths = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 
                         'Jumada I', 'Jumada II', 'Rajab', 'Shaban',
                         'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'];
    
    this.monthName = hijriMonths[hijriDate.month - 1]; // month is 1-indexed
    this.yearDisplay = `${hijriDate.year} AH`;
    
    // Generate calendar
    this.calendarDays = [];
    
    // Get the first day of the Hijri month in Gregorian
    const firstDayGregorian = this.hijriToGregorian(hijriDate.year, hijriDate.month, 1);
    const firstDayOfWeek = firstDayGregorian.getDay();
    
    // Hijri months alternate between 29 and 30 days (with some variation)
    const daysInHijriMonth = this.getHijriMonthDays(hijriDate.year, hijriDate.month);
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      this.calendarDays.push({ day: null, date: null });
    }
    
    // Add days of month
    for (let day = 1; day <= daysInHijriMonth; day++) {
      const date = this.hijriToGregorian(hijriDate.year, hijriDate.month, day);
      const tasksCount = this.getTasksForDate(date).length;
      
      this.calendarDays.push({
        day,
        date,
        tasksCount,
        isToday: this.isToday(date),
        isSelected: this.selectedDate && this.isSameDay(date, this.selectedDate)
      });
    }
  }

// Convert Hijri date to Gregorian
  hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    // Calculate Julian day from Hijri date
    let jd = Math.floor((11 * hijriYear + 3) / 30) + 354 * hijriYear + 30 * hijriMonth - Math.floor((hijriMonth - 1) / 2) + hijriDay + 1948440 - 385;
    
    // Convert Julian day to Gregorian
    let a = jd + 32044;
    let b = Math.floor((4 * a + 3) / 146097);
    let c = a - Math.floor((146097 * b) / 4);
    let d = Math.floor((4 * c + 3) / 1461);
    let e = c - Math.floor((1461 * d) / 4);
    let m = Math.floor((5 * e + 2) / 153);
    
    let day = e - Math.floor((153 * m + 2) / 5) + 1;
    let month = m + 3 - 12 * Math.floor(m / 10);
    let year = 100 * b + d - 4800 + Math.floor(m / 10);
    
    return new Date(year, month - 1, day);
  }

  // Get number of days in a Hijri month
  getHijriMonthDays(year: number, month: number): number {
    // Hijri months alternate between 29 and 30 days
    // Odd months (1,3,5,7,9,11) have 30 days
    // Even months (2,4,6,8,10) have 29 days
    // Month 12 has 29 days in regular years, 30 in leap years
    
    if (month % 2 === 1) {
      return 30; // Odd months
    } else if (month === 12) {
      // Check if leap year (30-year cycle, years 2,5,7,10,13,16,18,21,24,26,29 are leap)
      const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
      const cycleYear = year % 30;
      return leapYears.includes(cycleYear) ? 30 : 29;
    } else {
      return 29; // Even months (except 12)
    }
  }

  // Simplified Hijri conversion (use a proper library in production)
  toHijri(date: Date): { year: number; month: number; day: number } {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JS months are 0-indexed
    const day = date.getDate();
    
    // Calculate Julian Day Number
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    
    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    // Convert Julian Day to Hijri
    let l = jd - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    
    let hijriMonth = Math.floor((24 * l) / 709);
    let hijriDay = l - Math.floor((709 * hijriMonth) / 24);
    let hijriYear = 30 * n + j - 30;
    
    return { year: hijriYear, month: hijriMonth, day: hijriDay };
  }

  // Calendar navigation
  previousMonth() {
    if (this.calendarType === 'gregorian') {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() - 1,
        1
      );
    } else {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() - 1,
        1
      );
    }
          this.selectedDate = null;

    this.generateCalendar();
  }

  nextMonth() {

    if (this.calendarType === 'gregorian') {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        1
      );
      
    } else {
      this.currentDate = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        1
      );
    }
      this.selectedDate = null;
    this.generateCalendar();
  }

  toggleCalendarType() {
    this.calendarType = this.calendarType === 'gregorian' ? 'hijri' : 'gregorian';
    this.generateCalendar();
  }

  // Date selection
  selectDate(calendarDay: any) {
    if (!calendarDay.date) return;
    
    this.selectedDate = calendarDay.date;
    this.selectedDateTasks = this.getTasksForDate(calendarDay.date);
    this.showTaskForm = false;
    this.generateCalendar();
  }

  // Task management
  async loadTasks() {
    if (!this.currentUser) return;
    
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('prayer_tasks')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('date', { ascending: true });
      
      if (error) throw error;
      this.tasks = data || [];
      
      if (this.selectedDate) {
        this.selectedDateTasks = this.getTasksForDate(this.selectedDate);
      }
      
      this.generateCalendar();
    } catch (error) {
      console.error('Error loading tasks:', error);
      await this.showAlert('Error', 'Failed to load tasks. Please check your Supabase configuration.');
    }
  }

  getTasksForDate(date: Date): Task[] {
    const dateStr = this.formatDate(date);
    return this.tasks.filter(task => task.date === dateStr);
  }

  openTaskForm() {
    if (!this.selectedDate) {
      this.showAlert('No Date Selected', 'Please select a date first.');
      return;
    }
    this.showTaskForm = true;
  }

  closeTaskForm() {
    this.showTaskForm = false;
    this.newTask = {
      title: '',
      prayer_time: 'fajr',
      duration: null
    };
  }

  async saveTask() {
    if (!this.selectedDate || !this.newTask.title.trim()) {
      await this.showAlert('Invalid Task', 'Please enter a task title.');
      return;
    }

    if (!this.currentUser) {
      await this.showAlert('Not Authenticated', 'Please sign in to save tasks.');
      return;
    }

    const task: Task = {
      user_id: this.currentUser.id,
      date: this.formatDate(this.selectedDate),
      prayer_time: this.newTask.prayer_time,
      title: this.newTask.title.trim(),
      duration: this.newTask.duration || undefined
    };

    try {
      const { data, error } = await this.supabaseService.supabase
        .from('prayer_tasks')
        .insert([task])
        .select();

      if (error) throw error;

      await this.loadTasks();
      this.closeTaskForm();
      await this.showAlert('Success', 'Task added successfully!');
    } catch (error) {
      console.error('Error saving task:', error);
      await this.showAlert('Error', 'Failed to save task. Please try again.');
    }
  }

  async deleteTask(task: Task) {
    const alert = await this.alertController.create({
      header: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const { error } = await this.supabaseService.supabase
                .from('prayer_tasks')
                .delete()
                .eq('id', task.id);

              if (error) throw error;

              await this.loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              await this.showAlert('Error', 'Failed to delete task.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getPrayerLabel(prayerTime: string): string {
    const prayer = this.prayerTimes.find(p => p.value === prayerTime);
    return prayer ? prayer.label : prayerTime;
  }

  getPrayerIcon(prayerTime: string): string {
    const prayer = this.prayerTimes.find(p => p.value === prayerTime);
    return prayer ? prayer.icon : '🕌';
  }

  // Utility functions
  formatDate(date: Date): string {
    // Use local date components to avoid UTC shift causing off-by-one day
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /** PULL TO REFRESH */
  async handleRefresh(event: any) {
    try {
     window.location.reload();

      console.log('✅ Tab2 refreshed');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      event.target.complete();
    }
  }
}
