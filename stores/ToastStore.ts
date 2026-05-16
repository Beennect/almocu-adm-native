import { makeAutoObservable } from "mobx";

export type ToastType = 'success' | 'error' | 'info';

class ToastStore {
  visible: boolean = false;
  message: string = "";
  type: ToastType = 'info';
  timeoutId: any = null;

  constructor() {
    makeAutoObservable(this);
  }

  show(message: string, type: ToastType = 'info') {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.message = message;
    this.type = type;
    this.visible = true;

    this.timeoutId = setTimeout(() => {
      this.hide();
    }, 3000);
  }

  hide() {
    this.visible = false;
  }
}

export const toastStore = new ToastStore();
