import { Component, OnInit, Inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { SupabaseService } from 'src/app/services/supabase';
import { ModalController } from '@ionic/angular';
import { ScheduleModalComponent } from 'src/app/schedule-modal/schedule-modal.component';
;
@Component({
  selector: 'app-all-tasks',
  templateUrl: './all-tasks.page.html',
  styleUrls: ['./all-tasks.page.scss'],
  standalone: false,
})
export class AllTasksPage implements OnInit {
  tasks: any[] = [];
  loading = true;
filter = 'all';
  filteredTasks: any[] | undefined;

  constructor(
    @Inject(SupabaseService) private supabaseService: SupabaseService,
    private toastCtrl: ToastController,private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.loadAllTasks();
    this.applyFilter();
  }

  private async loadAllTasks() {
    const user = (await this.supabaseService.supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await this.supabaseService.supabase
      .from('prayer_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('prayer_time', { ascending: true });

    if (error) throw error;

    this.tasks = data.map((t: { completed: any; }) => ({
      ...t,
      completed: t.completed ?? false,
    }));

    this.loading = false;
  }

  trackById = (_: number, item: any) => item.id;

  async toggleCompleted(task: any, checked: boolean) {
    const original = task.completed;
    task.completed = checked;
    try {
      const user = (await this.supabaseService.supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');
      const { error } = await this.supabaseService.supabase
        .from('prayer_tasks')
        .update({ completed: checked })
        .eq('id', task.id)
        .eq('user_id', user.id);
      if (error) throw error;
      this.presentToast(checked ? 'Marked complete' : 'Marked incomplete');
    } catch (e) {
      task.completed = original; // rollback on failure
      this.presentToast('Could not update task', 'danger');
    }
  }

  private async presentToast(message: string, color: string = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 1300, color });
    await t.present();
  }
  
applyFilter() {
  switch (this.filter) {
    case 'done':
      this.filteredTasks = this.tasks.filter(t => t.completed);
      break;
    case 'undone':
      this.filteredTasks = this.tasks.filter(t => !t.completed);
      break;
    default:
      this.filteredTasks = this.tasks;
  }
}
async deleteTask(task: any) {
  const { error } = await this.supabaseService.supabase
    .from('prayer_tasks')
    .delete()
    .eq('id', task.id);

  if (error) return this.presentToast('Failed to delete task', 'danger');
  this.tasks = this.tasks.filter(t => t.id !== task.id);
  this.applyFilter();
  this.presentToast('Task deleted');
}



// inject ModalController in constructor

async rescheduleTask(task: any) {
  const modal = await this.modalCtrl.create({
    component: ScheduleModalComponent,
    componentProps: { date: task.date },
    breakpoints: [0, 0.5, 0.8],
    initialBreakpoint: 0.5,
  });

  await modal.present();
  const { data: newDate } = await modal.onWillDismiss();

  if (!newDate || newDate === task.date) return;

  const { error } = await this.supabaseService.supabase
    .from('prayer_tasks')
    .update({ date: newDate })
    .eq('id', task.id);

  if (error) return this.presentToast('Could not reschedule', 'danger');

  task.date = newDate;
  this.presentToast('Task rescheduled');
}


}
