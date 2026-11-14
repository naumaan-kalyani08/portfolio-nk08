// One-shot "the site has finished loading" signal, fired by the Preloader.
// Components that choreograph their entrance (hero intro, scroll unlock)
// subscribe with onAppReady().
let ready = false;
const listeners = new Set();

export const isAppReady = () => ready;

export const onAppReady = (callback) => {
  if (ready) {
    callback();
    return () => {};
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const setAppReady = () => {
  if (ready) return;
  ready = true;
  listeners.forEach((callback) => callback());
  listeners.clear();
};
