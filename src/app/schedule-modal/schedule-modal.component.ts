import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-schedule-modal',
  templateUrl: './schedule-modal.component.html',
  styleUrls: ['./schedule-modal.component.scss'],
  standalone: false
})
export class ScheduleModalComponent  implements OnInit {

    @Input() date!: string;
  constructor(private modalCtrl: ModalController) {}
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  confirm() {
    this.modalCtrl.dismiss(this.date);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}