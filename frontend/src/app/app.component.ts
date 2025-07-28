import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend app is running!';
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  loginError = '';

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Replace with actual login logic
        console.log('Login data:', this.loginForm.value);
      }, 1500);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
