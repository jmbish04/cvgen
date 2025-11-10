export function broadcast(ws: WebSocket, sockets: WebSocket[], message: string | ArrayBuffer) {
    const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
    for (const sock of sockets) {
        if (sock !== ws && sock.readyState === WebSocket.READY_STATE_OPEN) {
            sock.send(text);
        }
    }
}

export async function handleErrors(
    do_obj: DurableObject,
    fn: () => Promise<void> | void
  ) {
    try {
      await fn();
    } catch (err) {
      let err_str;
      if (err instanceof Error) {
        err_str = err.stack;
      } else {
        err_str = `${err}`;
      }
      console.error('error in durable object:', err_str);
      for (const ws of do_obj.ctx.getWebSockets()) {
        ws.close(1011, err_str);
      }
    }
  }