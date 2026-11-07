import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

const root = document.documentElement;

function setKeyboardHeight(height) {
  const open = height > 80;
  root.style.setProperty("--of-kb", `${open ? Math.round(height) : 0}px`);
  root.classList.toggle("of-kb-open", open);
}

function watchNative() {
  Keyboard.addListener("keyboardWillShow", (info) => setKeyboardHeight(info.keyboardHeight)).catch(() => {});
  Keyboard.addListener("keyboardWillHide", () => setKeyboardHeight(0)).catch(() => {});
}

function watchViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const update = () => setKeyboardHeight(window.innerHeight - viewport.height - viewport.offsetTop);
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
}

export function initKeyboard() {
  setKeyboardHeight(0);
  if (Capacitor.isNativePlatform()) watchNative();
  else watchViewport();
}
