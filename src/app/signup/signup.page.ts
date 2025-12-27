import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit , AfterViewInit {
 registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(private fb: FormBuilder ,private toastController: ToastController,private supabase: SupabaseService) {}
  ngOnInit(): void {
  }
ngAfterViewInit() {
  const emailInput = document.querySelector('ion-input[name="signup-email"]') as any;
  if(emailInput) {
    emailInput.getInputElement().then((el: HTMLInputElement) => {
      el.blur();
      setTimeout(() => el.focus(), 50);
    });
  }
}

 async Register() {
    if (!this.registerForm.valid) return;

    const { email, password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.presentToast("Passwords do not match", "danger");
      return;
    }
if (!email || !password) {
      this.presentToast("Email and password are required", "danger");
      return;
    }
    const result = await this.supabase.signUp(email, password);
    // supabase service may return { user, session } without an `error` property;
    // guard against wrapped responses by checking for an error field at runtime.
    const error = (result as any)?.error;
    if (error) {
      this.presentToast(error.message || String(error), "danger");
      return;
    }
    this.presentToast("Registration successful!", "success");
    // TODO: connect your Supabase login here
    // this.authService.login(email!, password!)
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
