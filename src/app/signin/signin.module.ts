import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SigninPageRoutingModule } from './signin-routing.module';

import { SigninPage } from './signin.page';
import { SkyAnimationComponentModule } from "../components/sky-animation/sky-animation.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SigninPageRoutingModule,
    SkyAnimationComponentModule,
    
],
  declarations: [SigninPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // ✅ Add this line

})
export class SigninPageModule {}
