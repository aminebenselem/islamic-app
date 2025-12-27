import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { Tab4PageRoutingModule } from './tab4-routing.module';

import { Tab4Page } from './tab4.page';
import { SkyAnimationComponentModule } from "../components/sky-animation/sky-animation.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    Tab4PageRoutingModule,
    SkyAnimationComponentModule
],
  declarations: [Tab4Page]
})
export class Tab4PageModule {}
