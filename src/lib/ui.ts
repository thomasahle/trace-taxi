import { writable } from "svelte/store";

const prefersDesktop =
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

export const showThreadsList = writable(prefersDesktop);

export const toggleThreadsList = () => showThreadsList.update((v) => !v);
