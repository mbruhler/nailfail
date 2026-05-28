import { invoke } from "@tauri-apps/api/core";

export type NativeCameraPermission = {
  status: "notDetermined" | "restricted" | "denied" | "authorized" | "unsupported";
  granted: boolean;
  canPrompt: boolean;
};

export async function requestNativeCameraPermission(): Promise<NativeCameraPermission> {
  try {
    return await invoke<NativeCameraPermission>("request_camera_permission");
  } catch {
    return {
      status: "unsupported",
      granted: true,
      canPrompt: false,
    };
  }
}

export async function openNativeCameraSettings() {
  await invoke("open_camera_settings");
}

export async function resetNativeCameraPermission() {
  await invoke("reset_camera_permission");
}
