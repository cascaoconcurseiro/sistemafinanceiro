class EventEmitter {
  emit(event: string, data?: any) {}
  on(event: string, handler: Function) {}
  off(event: string, handler: Function) {}
}

export const eventEmitter = new EventEmitter();
