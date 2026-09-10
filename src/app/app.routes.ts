import type { Routes } from "@angular/router";
import { IframePageComponent } from "./iframe-page.component";
import { MainPageComponent } from "./main-page.component";
import { ViewerPageComponent } from "./viewer-page.component";

export const routes: Routes = [
  { path: "", component: MainPageComponent },
  { path: "viewer", component: ViewerPageComponent },
  { path: "iframe", component: IframePageComponent },
  { path: "**", redirectTo: "" }
];
