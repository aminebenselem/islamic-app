import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SkyAnimationComponent } from './sky-animation.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [SkyAnimationComponent],
  exports: [SkyAnimationComponent]
})
export class SkyAnimationComponentModule {}