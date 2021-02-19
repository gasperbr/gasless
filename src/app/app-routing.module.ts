import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutPageComponent } from './components/about-page/about-page.component';
import { TransactionComponent } from './components/transaction/transaction.component';

const routes: Routes = [
  {
    path: 'about',
    component: AboutPageComponent
  },
  {
    path: '',
    component: TransactionComponent
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
