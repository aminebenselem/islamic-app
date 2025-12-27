import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllTasksPage } from './all-tasks.page';

const routes: Routes = [
  {
    path: '',
    component: AllTasksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllTasksPageRoutingModule {}
