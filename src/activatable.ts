export default interface Activatable {
  setup(): void;
  start(): void;
  stop(): void;
  dispose(): void;
}
