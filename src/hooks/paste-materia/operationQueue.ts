
/**
 * Operation queue management for preventing duplicate operations
 */
export class OperationQueue {
  private queue = new Set<string>();

  /**
   * Check if operation is already in progress
   */
  has(operationId: string): boolean {
    return this.queue.has(operationId);
  }

  /**
   * Add operation to queue
   */
  add(operationId: string): void {
    this.queue.add(operationId);
  }

  /**
   * Remove operation from queue with optional delay
   */
  delete(operationId: string, delay = 1000): void {
    setTimeout(() => {
      this.queue.delete(operationId);
    }, delay);
  }

  /**
   * Clear all operations
   */
  clear(): void {
    this.queue.clear();
  }
}
