import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { version as appVersion } from "../package.json";
import { registerDevice, unregisterDevice } from "./notifications-api.js";

const TOKEN_KEY = "of.push.token";
const ASKED_KEY = "of.push.asked";

const hooks = { onOpenLink: () => {} };
let listening = false;

const platformReady = () => Capacitor.getPlatform() === "ios" || import.meta.env.VITE_ANDROID_PUSH === "1";

export const pushSupported = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications") && platformReady();

function storage(action, key, value) {
  try {
    if (action === "get") return localStorage.getItem(key);
    if (action === "set") localStorage.setItem(key, value);
    if (action === "remove") localStorage.removeItem(key);
  } catch {}
  return null;
}

async function onRegistration({ value }) {
  storage("set", TOKEN_KEY, value);
  await registerDevice({ platform: Capacitor.getPlatform(), token: value, appVersion }).catch(() => {});
}

function onAction({ notification }) {
  const link = notification?.data?.link;
  if (link) hooks.onOpenLink(link);
}

async function listen() {
  if (listening) return;
  listening = true;
  await PushNotifications.addListener("registration", onRegistration);
  await PushNotifications.addListener("registrationError", () => storage("remove", TOKEN_KEY));
  await PushNotifications.addListener("pushNotificationActionPerformed", onAction);
}

export async function initPush({ onOpenLink }) {
  hooks.onOpenLink = onOpenLink;
  if (!pushSupported()) return;
  await listen();
  const { receive } = await PushNotifications.checkPermissions();
  if (receive === "granted") await PushNotifications.register();
}

export async function shouldAskForPush() {
  if (!pushSupported() || storage("get", ASKED_KEY)) return false;
  const { receive } = await PushNotifications.checkPermissions();
  return receive === "prompt" || receive === "prompt-with-rationale";
}

export async function enablePush() {
  storage("set", ASKED_KEY, "1");
  if (!pushSupported()) return false;
  await listen();
  const { receive } = await PushNotifications.requestPermissions();
  if (receive !== "granted") return false;
  await PushNotifications.register();
  return true;
}

export function declinePush() {
  storage("set", ASKED_KEY, "1");
}

export async function unregisterPush() {
  const token = storage("get", TOKEN_KEY);
  if (!token) return;
  storage("remove", TOKEN_KEY);
  await unregisterDevice(token).catch(() => {});
}

export function syncAppBadge(unread) {
  if (!pushSupported() || unread > 0) return;
  PushNotifications.removeAllDeliveredNotifications().catch(() => {});
}
