import { PowerSyncCredentials } from '../../connection/PowerSyncCredentials';

export type RemoteOptions = {
  fetchCredentials: () => Promise<PowerSyncCredentials>;
};

//Refresh at least 30 sec before it expires
const REFRESH_CREDENTIALS_SAFETY_PERIOD_MS = 30_000;

export abstract class AbstractRemote {
  protected credentials?: PowerSyncCredentials;

  constructor(protected options: RemoteOptions) {}

  async getCredentials(): Promise<PowerSyncCredentials> {
    const { expiresAt } = this.credentials ?? {};
    if (expiresAt && expiresAt > new Date(new Date().valueOf() + REFRESH_CREDENTIALS_SAFETY_PERIOD_MS)) {
      return this.credentials!;
    }
    this.credentials = await this.options.fetchCredentials();
    return this.credentials;
  }

  async getToken() {
    const { token } = await this.getCredentials();
    if (!token) {
      const error: any = new Error(`Not signed in`);
      error.status = 401;
      throw error;
    }

    return token;
  }

  async getHeaders() {
    const credentials = await this.getCredentials();
    return {
      'content-type': 'application/json',
      'User-Id': credentials.userID ?? '',
      Authorization: `Token ${credentials.token}}`
    };
  }

  abstract post(path: string, data: any, headers?: Record<string, string>): Promise<any>;
  abstract get(path: string, headers?: Record<string, string>): Promise<any>;
  abstract postStreaming(path: string, data: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<any>;

  isAvailable() {
    return true;
  }
}
