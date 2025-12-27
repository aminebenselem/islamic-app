import { Component, OnInit } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { SupabaseService } from './services/supabase';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';

register();
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
    constructor(private supabase: SupabaseService, private navCtrl: NavController , private router:Router) {
      
  }
  ngOnInit() {
  let initialized = false;

  this.supabase.session$.subscribe(session => {
    if (!initialized) {
      initialized = true; // ignore first emission
      return;
    }

    const currentUrl = this.router.url;

    if (session && !currentUrl.startsWith('/tabs') && currentUrl !== '/') {
      this.navCtrl.navigateRoot('/tabs/tab1');
    } else if (!session && currentUrl !== '/signin') {
      this.navCtrl.navigateRoot('/signin');
    }
  });
  }



}
