import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class FranceConnectService {
  private readonly logger = new Logger(FranceConnectService.name);

  private readonly clientId =
    process.env.FC_CLIENT_ID ??
    'ce81ca3621942c4a4100014c00d251d1e4393c3db7deee8023d044a5ac9514c1';
  private readonly clientSecret =
    process.env.FC_CLIENT_SECRET ??
    '6c88321bfdf1596caa82fb241304341e15df2b389bcaacb2fcfbe86a88b2b5fe';

  private readonly base =
    process.env.FC_BASE_URL ??
    'https://fcp-low.sbx.dev-franceconnect.fr/api/v2';

  private readonly callbackUrl =
    process.env.FC_CALLBACK_URL ??
    'http://localhost/api/auth/france-connect/callback';

  private readonly scope =
    process.env.FC_SCOPE ?? 'openid given_name family_name email';

  readonly defaultAppRedirect =
    process.env.APP_REDIRECT_URL ?? 'application://auth';

  // state -> { nonce, appRedirect } (in-memory; fine for hackathon / single instance)
  private readonly pending = new Map<
    string,
    { nonce: string; appRedirect: string }
  >();

  buildAuthorizeUrl(appRedirect?: string): string {
    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    this.pending.set(state, {
      nonce,
      appRedirect: appRedirect || this.defaultAppRedirect,
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: this.scope,
      state,
      nonce,
      // FranceConnect v2 (fcp-low) requires an eIDAS assurance level.
      acr_values: 'eidas1',
    });
    return `${this.base}/authorize?${params.toString()}`;
  }

  consumeState(state: string): string | null {
    const entry = this.pending.get(state);
    if (!entry) return null;
    this.pending.delete(state);
    return entry.appRedirect;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string }> {
    const res = await fetch(`${this.base}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.callbackUrl,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Token exchange failed: ${res.status} ${text}`);
      throw new BadRequestException('Échec de l’échange du code France Connect.');
    }

    const json = (await res.json()) as { access_token: string };
    return { accessToken: json.access_token };
  }

  async fetchUserInfo(accessToken: string): Promise<{
    email: string;
    givenName?: string;
    familyName?: string;
  }> {
    const res = await fetch(`${this.base}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`UserInfo failed: ${res.status} ${text}`);
      throw new BadRequestException('Échec de la récupération du profil France Connect.');
    }

    const contentType = res.headers.get('content-type') ?? '';
    let claims: Record<string, any>;
    if (contentType.includes('application/jwt')) {
      // FC v2 returns a signed JWT — decode the payload (not verifying signature here).
      const jwt = await res.text();
      const payload = jwt.split('.')[1];
      claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } else {
      claims = (await res.json()) as Record<string, any>;
    }

    if (!claims.email) {
      throw new BadRequestException('France Connect n’a pas fourni d’email.');
    }
    return {
      email: claims.email,
      givenName: claims.given_name,
      familyName: claims.family_name,
    };
  }
}
