import { User } from './../../../models/user';
import {
  Component,
  OnInit,
  ViewChild,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { jqxWindowComponent } from 'jqwidgets-ng/jqxwindow';
import { first } from 'rxjs/operators';
declare var $: any;

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent implements OnInit {
  @ViewChild('contactWindow', { static: false })
  contactWindow: jqxWindowComponent;
  loading = false;
  @Input() users: User[];
  @Output() contactClick = new EventEmitter();

  constructor() {}

  contactDataClick(userId: string, userName: string) {
    const videoDetails = {
      userId: userId,
      userName: userName,
    };
    this.contactClick.emit(videoDetails);
  }

  onChange(event: any) {
    let searchValue = event.target.value;
    if (searchValue.trim() != '') {
      $('.contact-list > div').css('display', 'flex');
      this.users.filter((searchfilter) => {
        let fullName =
          searchfilter.firstName.toLowerCase() +
          ' ' +
          searchfilter.lastName.toLowerCase();
        if (!fullName.includes(searchValue.toLowerCase())) {
          $('.contact-list ' + '#' + searchfilter.id).css('display', 'none');
        }
      });
    } else {
      $('.contact-list > div').css('display', 'flex');
    }
  }

  ngOnInit(): void {
    
  }
}
