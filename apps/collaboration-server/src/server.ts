import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import dotenv from 'dotenv';
import { parseRoomName } from './middleware/connectionGuard';
import { authenticateConnectionToken, AuthenticatedUser } from './auth/tokenAuth';
import { persistence } from './persistence/documentPersistence';
import { RedisPubSubManager } from './redis/pubsub';

dotenv.config();

const PORT = parseInt(process.env.COLLAB_PORT || process.env.PORT || '1234', 10);
const HOST = process.env.COLLAB_HOST || '0.0.0.0';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const redisManager = new RedisPubSubManager(process.env.REDIS_URL);

// In-memory document rooms state
interface RoomState {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Map<WebSocket, Set<number>>;
}

const docs = new Map<string, RoomState>();

const messageSync = 0;
const messageAwareness = 1;

function getOrCreateRoom(roomName: string, pageId: string): RoomState {
  let room = docs.get(roomName);
  if (!room) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    // Initial load from persistence
    persistence.loadDocument(pageId, doc).catch((err) => {
      console.error(`[Persistence] Error loading page ${pageId}:`, err);
    });

    const conns = new Map<WebSocket, Set<number>>();

    doc.on('update', (update: Uint8Array, origin: any) => {
      // Debounced persistence to PostgreSQL
      persistence.saveUpdate(pageId, update, doc).catch(console.error);

      // Publish to Redis for multi-instance scaling
      if (origin !== 'redis') {
        redisManager.publishUpdate(roomName, update).catch(console.error);
      }

      // Broadcast update to all clients in this room
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      conns.forEach((_, conn) => {
        if (conn !== origin && conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    });

    awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      const changedClients = added.concat(updated, removed);

      if (origin && conns.has(origin)) {
        const connControlledIDs = conns.get(origin);
        if (connControlledIDs) {
          added.forEach((clientID: number) => {
            connControlledIDs.add(clientID);
          });
          updated.forEach((clientID: number) => {
            connControlledIDs.add(clientID);
          });
          removed.forEach((clientID: number) => {
            connControlledIDs.delete(clientID);
          });
        }
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);

      conns.forEach((_, conn) => {
        if (conn !== origin && conn.readyState === WebSocket.OPEN) {
          conn.send(buff);
        }
      });
    });

    // Subscribe to Redis updates for this room
    redisManager.subscribeToRoom(roomName, (update) => {
      Y.applyUpdate(doc, update, 'redis');
    });

    room = { name: roomName, doc, awareness, conns };
    docs.set(roomName, room);
  }
  return room;
}

// REST health endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'realcollab-collaboration-server',
    uptimeSeconds: Math.floor(process.uptime()),
    activeRooms: docs.size,
    totalConnections: Array.from(docs.values()).reduce((sum, r) => sum + r.conns.size, 0),
    redis: redisManager.status,
    timestamp: new Date().toISOString(),
  });
});

// Helper to extract cookie from cookie header
function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

// HTTP Upgrade to WebSocket
server.on('upgrade', async (request, socket, head) => {
  try {
    const url = request.url || '/';
    const parsedRoom = parseRoomName(url);

    if (!parsedRoom) {
      console.warn(`[WS] Rejected connection to invalid room URL: ${url}`);
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // Extract auth token from query params or cookie
    const fullUrl = new URL(url, `http://${request.headers.host || 'localhost'}`);
    let token = fullUrl.searchParams.get('token');
    if (!token) {
      token = parseCookie(request.headers.cookie, 'realcollab_session');
    }

    const authUser = await authenticateConnectionToken(token, parsedRoom.workspaceId);
    if (!authUser) {
      console.warn(`[WS] Unauthorized connection attempt to room: ${parsedRoom.raw}`);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      wss.emit('connection', ws, request, { room: parsedRoom, user: authUser });
    });
  } catch (err: any) {
    console.error('[WS] Upgrade exception:', err.message);
    socket.destroy();
  }
});

// WebSocket Connection Management
wss.on('connection', (conn: WebSocket, _req: http.IncomingMessage, context: any) => {
  const { room: parsedRoom, user } = context as { room: { raw: string; workspaceId: string; pageId: string }; user: AuthenticatedUser };
  const room = getOrCreateRoom(parsedRoom.raw, parsedRoom.pageId);
  room.conns.set(conn, new Set());

  console.log(`[WS] Client joined room: ${parsedRoom.raw} (User: ${user.name}, Role: ${user.role})`);

  // 1. Initial Sync Step 1: Send local state vector to client
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, room.doc);
  conn.send(encoding.toUint8Array(encoder));

  // 2. Send current awareness states to client
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }

  // Handle incoming messages from client
  conn.on('message', (message: ArrayBuffer) => {
    try {
      const uint8Msg = new Uint8Array(message);
      const decoder = decoding.createDecoder(uint8Msg);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case messageSync: {
          // If user is a VIEWER or COMMENTER, verify they are not attempting an unauthorized mutation
          if (user.role === 'VIEWER' || user.role === 'COMMENTER') {
            const peekDecoder = decoding.createDecoder(uint8Msg);
            decoding.readVarUint(peekDecoder); // consume messageSync (0)
            const syncStep = decoding.readVarUint(peekDecoder);
            if (syncStep === syncProtocol.messageYjsUpdate || syncStep === syncProtocol.messageYjsSyncStep2) {
              console.warn(`[RBAC] Blocked update from read-only client ${user.name} (${user.role})`);
              return;
            }
          }

          // Read and process sync message
          const syncEncoder = encoding.createEncoder();
          encoding.writeVarUint(syncEncoder, messageSync);
          syncProtocol.readSyncMessage(decoder, syncEncoder, room.doc, conn);

          if (encoding.length(syncEncoder) > 1) {
            conn.send(encoding.toUint8Array(syncEncoder));
          }
          break;
        }
        case messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            conn
          );
          break;
        }
        default:
          console.warn(`[WS] Unknown message type: ${messageType}`);
      }
    } catch (err: any) {
      console.error('[WS] Message handling error:', err.message);
    }
  });

  conn.on('close', () => {
    console.log(`[WS] Client disconnected from room: ${parsedRoom.raw}`);
    const controlledIds = room.conns.get(conn);
    room.conns.delete(conn);
    if (controlledIds && controlledIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        Array.from(controlledIds),
        null
      );
    }

    // Clean up empty room after timeout if no connections remain
    if (room.conns.size === 0) {
      setTimeout(() => {
        if (room.conns.size === 0) {
          docs.delete(parsedRoom.raw);
          console.log(`[WS] Evicted inactive room: ${parsedRoom.raw}`);
        }
      }, 30000);
    }
  });
});

async function startServer() {
  await redisManager.connect();
  server.listen(PORT, HOST, () => {
    console.log(`🚀 RealCollab Collaboration Server running on http://${HOST}:${PORT}`);
    console.log(`📡 WebSocket endpoint ready at ws://${HOST}:${PORT}`);
    console.log(`🩺 Health check accessible at http://${HOST}:${PORT}/health`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
