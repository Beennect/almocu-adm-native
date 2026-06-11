import { makeAutoObservable } from 'mobx';

class UiStore {
  sidebarCollapsed = false;
  sidebarOverlay = false;

  constructor() {
    makeAutoObservable(this);
  }

  setSidebarCollapsed(v: boolean) {
    this.sidebarCollapsed = v;
    if (!v) {
      this.sidebarOverlay = false;
    }
  }

  toggleSidebar() {
    if (this.sidebarCollapsed) {
      this.sidebarOverlay = !this.sidebarOverlay;
    }
  }

  showSidebarOverlay() {
    this.sidebarOverlay = true;
  }

  hideSidebarOverlay() {
    this.sidebarOverlay = false;
  }
}

export const uiStore = new UiStore();
