import ora, { type Ora } from 'ora';

export class Spinner {
  private instance: Ora | null = null;

  start(text: string): void {
    this.instance = ora({ text, color: 'yellow' }).start();
  }

  succeed(text?: string): void {
    this.instance?.succeed(text);
    this.instance = null;
  }

  fail(text?: string): void {
    this.instance?.fail(text);
    this.instance = null;
  }

  warn(text?: string): void {
    this.instance?.warn(text);
    this.instance = null;
  }

  update(text: string): void {
    if (this.instance) {
      this.instance.text = text;
    }
  }

  stop(): void {
    this.instance?.stop();
    this.instance = null;
  }
}
