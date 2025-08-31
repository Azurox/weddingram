import type { IziToastSettings } from 'izitoast'

export class ToastService {
  static getPresetForError(): Partial<IziToastSettings> {
    return {
      animateInside: false,
      timeout: 8000,
      backgroundColor: '#aa253e',
      titleColor: '#fff',
      messageColor: '#fff',
      position: 'bottomCenter',
      iconColor: '#fff',
      theme: 'dark',
      titleLineHeight: '30',
      icon: undefined,
    }
  }
}
