import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { Tab1PageRoutingModule } from './tab1-routing.module';
import { SkyAnimationComponentModule } from '../components/sky-animation/sky-animation.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    Tab1PageRoutingModule,
    SkyAnimationComponentModule,
    
  ],
  declarations: [Tab1Page],
    schemas: [CUSTOM_ELEMENTS_SCHEMA] // ✅ Add this line

})
export class Tab1PageModule {}
