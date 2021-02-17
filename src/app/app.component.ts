import { Component } from '@angular/core';
import { EthereumService } from './services/ethereum.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(public ethereumService: EthereumService) { }

  connectMetamask() {
    this.ethereumService.initMetamask();
  }

}
