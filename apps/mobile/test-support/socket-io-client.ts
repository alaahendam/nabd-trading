// Stands in for `socket.io-client` in every test, so no test opens a real connection. The shared
// realtime package imports the real one; Jest maps it here (see `moduleNameMapper`). Behaviour of
// the connection is tested with `FakeSocket` from `@nabd/testing`, at the client's own port.
const nothing = () => undefined;

export const io = () => ({
  connected: false,
  connect: nothing,
  disconnect: nothing,
  emit: nothing,
  on: nothing,
  io: { on: nothing },
});
