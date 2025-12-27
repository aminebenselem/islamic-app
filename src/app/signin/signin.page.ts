import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
  standalone: false,
})
export class SigninPage implements OnInit {

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(private fb: FormBuilder ,private supabase: SupabaseService, private navCtrl: NavController ,private toastController: ToastController) {}
  ngOnInit(): void {
  }

 async login() {
  if (!this.loginForm.valid) return;

  const { email, password } = this.loginForm.value as { email: string; password: string };

  try {
    const data = await this.supabase.signIn(email, password);
    await this.presentToast('Logged in successfully', 'success');
    this.navCtrl.navigateRoot('/tabs/tab1');

  } catch (err: any) {
    await this.presentToast(err.message || 'Login failed', 'danger');
  }
}



  async signInWithGoogle() {
    await this.supabase.signInWithGoogle();
  }

  forgotPassword() {
    console.log("Reset password clicked");
  }
  
async presentToast(message: string ,color:string) {
  const toast = await this.toastController.create({
    message: message,
    duration: 2000, // in ms
    position: 'bottom', // 'top', 'middle', or 'bottom'
    color: color, // 'primary', 'danger', 'warning', etc.
  });

  await toast.present();
}
}
