
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-common-header',
  templateUrl: './common-header.component.html',
  styleUrls: [
    './common-header.component.css',
    './common-header-media.component.css',
  ],
})
export class CommonHeaderComponent implements OnInit {
  firstName: string;
  lastName: string;
  constructor() {}


  ngOnInit(): void {
    this.firstName = 'User';
    this.lastName = 'Name';
  }
}
