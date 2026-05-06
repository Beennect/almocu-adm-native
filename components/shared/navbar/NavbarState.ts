import { makeAutoObservable } from "mobx";

class NavbarStore {
  activeTab: string = "home";

  constructor() {
    makeAutoObservable(this);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}

export const navbarStore = new NavbarStore();
