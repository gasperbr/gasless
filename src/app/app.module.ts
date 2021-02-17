import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AboutPageComponent } from './components/about-page/about-page.component';
import { TransactionComponent } from './components/transaction/transaction.component';

import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AddressPipe } from './pipes/address.pipe';
import { SwapComponent } from './components/transaction/swap/swap.component';
import { TransferComponent } from './components/transaction/transfer/transfer.component';
import { RemoveLiquidityComponent } from './components/transaction/remove-liquidity/remove-liquidity.component';

@NgModule({
  declarations: [
    AppComponent,
    AboutPageComponent,
    TransactionComponent,
    AddressPipe,
    SwapComponent,
    TransferComponent,
    RemoveLiquidityComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
