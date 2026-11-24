import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

/**
 * Socket.IO runs its own CORS check at the handshake and Nest gateways do not read
 * `enableCors`, so the single allowed origin is passed to the Socket.IO server here.
 */
export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origin: string,
  ) {
    super(app);
  }

  /**
   * Nest passes partial options at runtime although Socket.IO types `ServerOptions` as if every
   * field were required, hence the one assertion.
   */
  override createIOServer(port: number | undefined, options?: Partial<ServerOptions>): Server {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origin },
    } as ServerOptions);
  }
}
