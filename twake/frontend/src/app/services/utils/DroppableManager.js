import $ from 'jquery';

class DroppableManager {
  constructor() {
    this.drop = {};
    this.draggingData = {};
    this.dragging = false;
  }

  over(key, callback, event) {
    this.drop[key] = {
      callback: callback,
      element: event.target,
    };
  }

  out(key) {
    this.drop[key] = undefined;
    delete this.drop[key];
  }

  up() {
    var that = this;
    if (!that.draggingData.type || !that.draggingData.data || that.draggingData.data.length == 0) {
      //console.log("Data should be of the form {type:string, data: [...]}");
      return;
    }
    if (!this.dragging) {
      //console.log("not dragging right now");
      return;
    }
<<<<<<< HEAD
    $.each(this.drop, function (i, el) {
=======
    $.each(this.drop, function(i, el) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      if (el && el.callback) {
        el.callback(that.draggingData);
      }
    });
  }
}

const instanceDroppableManager = new DroppableManager();
export default instanceDroppableManager;
