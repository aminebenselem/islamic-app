import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PrayerTimeService {
  private baseUrl = 'https://api.aladhan.com/v1';

  constructor(private http: HttpClient) {}

 getPrayerTimesByCoords(lat: number, lon: number): Observable<any> {
  const method = 3;
  const tune = '0,0,0,7,0,2,0,5,0';

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const tomorrowDate = `${tomorrow.getDate()}-${tomorrow.getMonth() + 1}-${tomorrow.getFullYear()}`;

  const todayUrl = `${this.baseUrl}/timings/${todayDate}?latitude=${lat}&longitude=${lon}&method=${method}&tune=${tune}`;
  const tomorrowUrl = `${this.baseUrl}/timings/${tomorrowDate}?latitude=${lat}&longitude=${lon}&method=${method}&tune=${tune}`;

    
  // ✅ Fetch both days in parallel
  return forkJoin({
    today: this.http.get<any>(todayUrl),
    tomorrow: this.http.get<any>(tomorrowUrl)
  }).pipe(
    map(({ today, tomorrow }) => {
      const todayData = today.data.timings;
      const tomorrowFajr = tomorrow.data.timings.Fajr;

      // ✅ Combine into one clean object
      return {
        ...todayData,
        tomorrowFajr
      };
    })
  );
}


  // (Optional) old version if you still want to get by city name
  getPrayerTimes(city: string): Observable<any> {
    const url = `${this.baseUrl}/timingsByCity?city=${city}&country=Tunisia&method=3`;
    return this.http.get<any>(url).pipe(map(res => res.data));
  }
}
