import versionData from './version.json';

export interface VersionInfo {
  lastUpdated: string;
}

export function getVersionInfo(): VersionInfo {
  return versionData as VersionInfo;
}

export function getLastUpdated(): string {
  return versionData.lastUpdated;
}









