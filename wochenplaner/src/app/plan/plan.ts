import { Component } from '@angular/core';
import { Montag } from "./montag/montag";
import { Dienstag } from "./dienstag/dienstag";
import { Mittwoch } from "./mittwoch/mittwoch";
import { Donnerstag } from "./donnerstag/donnerstag";
import { Freitag } from "./freitag/freitag";
import { Samstag } from "./samstag/samstag";
import { Sonntag } from "./sonntag/sonntag";

@Component({
  selector: 'app-plan',
  imports: [Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag],
  templateUrl: './plan.html',
  styleUrl: './plan.css',
})
export class Plan {

}
