//var worker = new Worker('./timer-worker.js')

var worker = new Worker(new URL('backend.ts', import.meta.url));
var vue3Timer = {
  id: 0,
  callbacks: [{ fn: Function, context: undefined }],

  setInterval: function (
    cb: any,
    interval: number,
    context = undefined,
    oneTime = false,
  ) {
    this.id++;
    var id = this.id;
    this.callbacks[id] = { fn: cb, context: context };
    worker.postMessage({
      command: 'interval:start',
      interval: interval,
      id: id,
      oneTime: oneTime,
    });
    return id;
  },

  setTimeout: function (cb: any, interval: number, context = undefined) {
    this.setInterval(cb, interval, context, true);
  },

  onMessage: function (e: any) {
    switch (e.data.message) {
      case 'interval:tick':
        var callback = this.callbacks[e.data.id];
        if (callback && callback.fn) callback.fn.apply(callback.context);
        if (e.data.message.oneTime)
          worker.postMessage({ command: 'interval:clear', id: e.data.id });
        break;
      case 'interval:cleared':
        delete this.callbacks[e.data.id];
        break;
    }
  },

  clearInterval: function (id: number) {
    worker.postMessage({ command: 'interval:clear', id: id });
  },
};

worker.onmessage = vue3Timer.onMessage.bind(vue3Timer);

export default vue3Timer;
