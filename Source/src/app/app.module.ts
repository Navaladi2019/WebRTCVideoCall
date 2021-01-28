
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonFooterComponent } from './shared/layout/components/common-footer/common-footer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonMainLayoutComponent } from './shared/layout/components/common-main-layout/common-main-layout.component';
import { CommonHeaderComponent } from './shared/layout/components/common-header/common-header.component';
import { DoctorContactComponent } from './core/page/doctor-contact/doctor-contact.component';
import { VideoComponent } from './shared/components/video/video.component';
import { VideoControlComponent } from './shared/components/video-control/video-control.component';
import { jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { ContactComponent } from './shared/components/contact/contact.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { PatientContactComponent } from './core/page/patient-contact/patient-contact.component';
import { TimerComponent } from './shared/components/timer/timer.component';
import { ConfirmModalComponent } from './shared/components/confirm-modal/confirm-modal.component';
import { LoaderComponent } from './shared/components/loader/loader.component';

@NgModule({
  declarations: [
    AppComponent,
    CommonFooterComponent,
    CommonMainLayoutComponent,
    CommonHeaderComponent,
    DoctorContactComponent,
    VideoComponent,
    VideoControlComponent,
    ContactComponent,
    PatientContactComponent,
    TimerComponent,
    ConfirmModalComponent,
    LoaderComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    jqxWindowModule,
    RouterModule.forRoot([
      {
        path: '',
        component: CommonMainLayoutComponent,
        children: [
          {
            path: 'patient',
            component: DoctorContactComponent,
          },
          {
            path: 'doctor',
            component: PatientContactComponent
          },
        ],
      },
      { path: '**', redirectTo: '' }
    ], {useHash: true}),
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
