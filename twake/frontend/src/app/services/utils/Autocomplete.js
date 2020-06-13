import Observable from 'services/observable.js';

class Autocomplete extends Observable {
  constructor() {
    super();
    this.observableName = 'autocompleteService';
    this.isOpen = false;
  }

  open() {
    console.log('open');
    this.isOpen = true;
    this.notify();
  }

  close() {
    console.log('close');
    this.isOpen = false;
    this.notify();
  }
}

const autocompleteService = new Autocomplete();
export default autocompleteService;
